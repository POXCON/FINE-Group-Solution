import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";

export interface WebStackProps extends cdk.StackProps {
  httpApi: apigwv2.HttpApi;
}

/**
 * Web スタック: S3(非公開) + CloudFront(OAC) で SPA を配信。
 * - default → S3、`/api/*` → API Gateway（同一オリジンのため CORS 不要）
 * - SPA ルーティングは CloudFront Function で /index.html へ書き換え
 *   （拡張子なし・/api 以外のパス）。グローバルなエラー応答書き換えは
 *   API 応答を壊すため使わない。
 *
 * 注意: デプロイ前に `frontend/dist`（本番ビルド）が存在すること。
 */
export class WebStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // dev で作り直しやすいよう削除可能に（本番運用時は要再検討）。
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SPA ルーティング: 拡張子の無いパス（= クライアントルート）は index.html を返す
    const spaFunction = new cloudfront.Function(this, "SpaRewrite", {
      code: cloudfront.FunctionCode.fromInline(
        [
          "function handler(event) {",
          "  var request = event.request;",
          "  var uri = request.uri;",
          "  if (uri !== '/' && uri.indexOf('.') === -1) {",
          "    request.uri = '/index.html';",
          "  }",
          "  return request;",
          "}",
        ].join("\n"),
      ),
    });

    const apiDomain = `${props.httpApi.apiId}.execute-api.${this.region}.amazonaws.com`;

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: "Invoice-Search frontend",
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
          origin: new origins.HttpOrigin(apiDomain, {
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

    new s3deploy.BucketDeployment(this, "DeploySite", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "..", "..", "frontend", "dist"))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: `https://${distribution.distributionDomainName}`,
      description: "公開URL（フロントエンド）",
    });
    new cdk.CfnOutput(this, "SiteBucketName", {
      value: bucket.bucketName,
    });
  }
}
