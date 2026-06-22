import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export interface UnifiedWebStackProps extends cdk.StackProps {
  /** API Gateway のドメイン（例: xxxx.execute-api.ap-northeast-1.amazonaws.com） */
  apiDomain: string;
}

/**
 * 統合 Web スタック: 1 つの S3(非公開) + 1 つの CloudFront(OAC) で
 * ポータルと Invoice-Search を同一オリジン配信する。
 *
 * パス設計:
 *   - `/`                 → ポータル(Common) SPA（バケット直下）
 *   - `/invoice-search/`  → Invoice-Search SPA（バケット `invoice-search/` 以下）
 *   - `/api/*`            → API Gateway（HTTP API）。同一オリジンのため CORS 不要
 *
 * SPA ルーティングは CloudFront Function で各アプリの index.html へ書き換える
 * （拡張子なし・/api 以外のパス）。グローバルなエラー応答書き換えは API 応答を
 * 壊すため使わない。
 *
 * 注意:
 *   - デプロイ前に `Common/frontend/dist` と `Invoice-Search/frontend/dist`
 *     （本番ビルド）が存在すること。
 *   - 2 本の BucketDeployment が同一バケットを共有するため、相互削除を避ける目的で
 *     両方に `prune: false` を設定している（既定 true だと一方が他方のオブジェクトを消す）。
 */
export class UnifiedWebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UnifiedWebStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // dev で作り直しやすいよう削除可能に（本番運用時は要再検討）。
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SPA ルーティング書き換え:
    //   - `/invoice-search` 系 → `/invoice-search/index.html`
    //   - それ以外（拡張子なし） → `/index.html`（ポータル）
    // CloudFront Functions は ES5.1 のため startsWith 不可 → indexOf を使用。
    const spaFunction = new cloudfront.Function(this, "SpaRewrite", {
      code: cloudfront.FunctionCode.fromInline(
        [
          "function handler(event) {",
          "  var request = event.request;",
          "  var uri = request.uri;",
          "  if (uri.indexOf('/invoice-search') === 0) {",
          "    if (uri === '/invoice-search' || uri === '/invoice-search/') { request.uri = '/invoice-search/index.html'; return request; }",
          "    if (uri.indexOf('.') === -1) { request.uri = '/invoice-search/index.html'; }",
          "    return request;",
          "  }",
          "  if (uri !== '/' && uri.indexOf('.') === -1) { request.uri = '/index.html'; }",
          "  return request;",
          "}",
        ].join("\n"),
      ),
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: "FINE unified frontend (portal + invoice-search + api)",
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: spaFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/*": {
          origin: new origins.HttpOrigin(props.apiDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          // Authorization 等のヘッダを転送（Host は除外）
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // ポータル(Common) → バケット直下（prefix 無し）。
    new s3deploy.BucketDeployment(this, "DeployPortal", {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, "..", "..", "..", "Common", "frontend", "dist"),
        ),
      ],
      destinationBucket: bucket,
      // 同一バケット共有のため相互削除を回避。
      prune: false,
      distribution,
      distributionPaths: ["/*"],
    });

    // Invoice-Search → バケット `invoice-search/` 以下。
    new s3deploy.BucketDeployment(this, "DeployInvoiceSearch", {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, "..", "..", "..", "Invoice-Search", "frontend", "dist"),
        ),
      ],
      destinationBucket: bucket,
      destinationKeyPrefix: "invoice-search",
      // 同一バケット共有のため相互削除を回避。
      prune: false,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: `https://${distribution.distributionDomainName}`,
      description: "公開URL（統合フロントエンド: ポータル / invoice-search / api）",
    });
    new cdk.CfnOutput(this, "SiteBucketName", {
      value: bucket.bucketName,
    });
  }
}
