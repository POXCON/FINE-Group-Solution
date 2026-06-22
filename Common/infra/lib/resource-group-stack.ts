import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as resourcegroups from "aws-cdk-lib/aws-resourcegroups";

/**
 * タグベースの AWS Resource Group。
 *
 * 全 CDK リソースに付与した統一タグ `Project=FINE-Group-Solution` を条件に、
 * 対応する全リソースを 1 つのグループへ集約する。これにより AWS コンソールで
 * FINE Group Solution のリソースを横断一覧でき、コスト按分も容易になる。
 *
 * タグ自体は各 `bin/app.ts` の `cdk.Tags.of(app)` で付与される。
 */
export class ResourceGroupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new resourcegroups.CfnGroup(this, "FineResourceGroup", {
      name: "FINE-Group-Solution",
      description:
        "FINE Group Solution の全リソース（タグ Project=FINE-Group-Solution）",
      resourceQuery: {
        type: "TAG_FILTERS_1_0",
        query: {
          resourceTypeFilters: ["AWS::AllSupported"],
          tagFilters: [
            {
              key: "Project",
              values: ["FINE-Group-Solution"],
            },
          ],
        },
      },
    });
  }
}
