#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { UnifiedWebStack } from "../lib/web-stack";
import { ResourceGroupStack } from "../lib/resource-group-stack";

/**
 * FINE 統合 CloudFront インフラ（同一オリジン配信 / Lambda 無し）
 *   1 つの CloudFront で以下を配信:
 *     - ポータル(Common)        → `/`
 *     - Invoice-Search          → `/invoice-search/`
 *     - API(API Gateway)        → `/api/*`
 * リージョンは東京（ap-northeast-1）固定。
 *
 * 前提:
 *   - `Common/frontend/dist` と `Invoice-Search/frontend/dist`（本番ビルド済み）が存在すること。
 *   - API のオリジンは context `apiDomain` で上書き可能（既定は Invoice-Search の HTTP API）。
 */
const app = new cdk.App();

// FINE Group Solution 統一タグ（コンソール横断一覧・コスト按分用）。
cdk.Tags.of(app).add("Project", "FINE-Group-Solution");
cdk.Tags.of(app).add("Environment", "prod");
cdk.Tags.of(app).add("ManagedBy", "CDK");
cdk.Tags.of(app).add("System", "common");

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
};

// API Gateway のドメイン（既定は Invoice-Search HTTP API）。context で上書き可能。
const apiDomain =
  app.node.tryGetContext("apiDomain") ??
  "6won8iq3he.execute-api.ap-northeast-1.amazonaws.com";

new UnifiedWebStack(app, "FineUnifiedWeb", {
  env,
  apiDomain,
});

// タグベースの AWS Resource Group（Project=FINE-Group-Solution で全リソースを横断）。
new ResourceGroupStack(app, "FineResourceGroup", { env });

app.synth();
