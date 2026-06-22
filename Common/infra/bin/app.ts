#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { UnifiedWebStack } from "../lib/web-stack";

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

app.synth();
