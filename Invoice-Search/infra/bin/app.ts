#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AuthStack } from "../lib/auth-stack";
import { ApiStack } from "../lib/api-stack";
import { WebStack } from "../lib/web-stack";

/**
 * Invoice-Search インフラ（最小・最安構成 / DB 無し）
 *   Cognito → Lambda(FastAPI/Mangum) + API Gateway → S3 + CloudFront
 * リージョンは東京（ap-northeast-1）固定。
 * デプロイ順: Auth → Api → (フロントビルド) → Web。
 */
const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

// 国税庁 公表 Web-API の設定を保持する SSM パラメータ名（デプロイ前に作成しておく）
const ntaAppIdParam = app.node.tryGetContext("ntaAppIdParam") ?? "/fine/invoice-search/nta-app-id";
const ntaApiUrlParam = app.node.tryGetContext("ntaApiUrlParam") ?? "/fine/invoice-search/nta-api-url";

const auth = new AuthStack(app, "InvoiceSearchAuth", { env });

const api = new ApiStack(app, "InvoiceSearchApi", {
  env,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  ntaAppIdParam,
  ntaApiUrlParam,
});

new WebStack(app, "InvoiceSearchWeb", {
  env,
  httpApi: api.httpApi,
});

app.synth();
