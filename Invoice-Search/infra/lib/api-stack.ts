import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  /** 国税庁 App ID を格納した SSM パラメータ名 */
  ntaAppIdParam: string;
  /** 国税庁 Web-API URL を格納した SSM パラメータ名 */
  ntaApiUrlParam: string;
}

/**
 * API スタック: FastAPI(Mangum) を Lambda 化し、HTTP API Gateway で公開。
 * DB は使わない。国税庁 API の設定は SSM Parameter Store から取得（デプロイ時に解決）。
 */
export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const backendDir = path.join(__dirname, "..", "..", "backend");

    // SSM から国税庁 API 設定を取得（デプロイ時に値が解決される。事前に作成しておくこと）
    const ntaAppId = ssm.StringParameter.valueForStringParameter(this, props.ntaAppIdParam);
    const ntaApiUrl = ssm.StringParameter.valueForStringParameter(this, props.ntaApiUrlParam);

    const fn = new PythonFunction(this, "ApiFunction", {
      entry: backendDir,
      index: "lambda_handler.py",
      handler: "handler",
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: {
        assetExcludes: [
          "tests",
          ".venv",
          "__pycache__",
          ".pytest_cache",
          ".env",
          ".mypy_cache",
          ".ruff_cache",
        ],
      },
      environment: {
        ENVIRONMENT: "production",
        DEBUG: "false",
        AUTH_DISABLED: "false",
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        COGNITO_APP_CLIENT_ID: props.userPoolClient.userPoolClientId,
        COGNITO_REGION: this.region,
        // fine-admin グループ所属者のみアクセス可。非所属は 403 で遮断。
        REQUIRED_COGNITO_GROUP: "fine-admin",
        INVOICE_APP_ID: ntaAppId,
        INVOICE_API_URL: ntaApiUrl,
        INVOICE_API_TIMEOUT_SECONDS: "10",
        INVOICE_API_MAX_RETRIES: "2",
        // CloudFront 同一オリジン経由のため CORS は基本不要（空）。
        CORS_ORIGINS: "",
      },
    });

    this.httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "invoice-search-api",
      defaultIntegration: new HttpLambdaIntegration("LambdaIntegration", fn),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.httpApi.apiEndpoint,
      description: "API Gateway のエンドポイント（CloudFront の /api/* オリジン）",
    });
  }
}
