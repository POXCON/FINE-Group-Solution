# Invoice Search Fast API
English version of README.md is on [here](./README_EN.md)  
<img src="assets/img/Invoice%20Search%20App-logo.png" width="50%">  

## 本ディレクトリの目的
本ディレクトリは、Invoice Search Web Appにて検索したインボイス番号に対して、国税庁の適格請求書発行事業者公表システムWeb-APIを呼び出し、検索結果をInvoice Search Web Appに返却するためのAPIです。  
なお、本ディレクトリはAzure App Serviceへのデプロイ専用に記載しています。

## 機能および留意点
国税庁の適格請求書発行事業者公表システムWeb-APIを呼び出すにあたり、呼び出し先のURLおよびアプリケーションIDの設定が必要です。  
なお、アプリケーションIDに関しては国税庁への申請が必要のため、[こちら]("https://www.invoice-kohyo.nta.go.jp/web-api/index.html")より申請ください。  
なお、APIへの大量アクセスは、国税庁に迷惑が掛かりますため、避けるようご留意いただけますようお願い致します。

## 環境変数
| カテゴリ                                | キー                                                 | 値                                                                                    |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 一般                                    | `VERSION`                                            | 1.0.0                                                                                 |
| 適格請求書発行事業者公表システムWeb-API | `INVOICE_APP_ID`                                      | 自身のアプリケーションID                                                              |
| 適格請求書発行事業者公表システムWeb-API | `INVOICE_API_URL`                                     | https://web-api.invoice-kohyo.nta.go.jp/1/valid?id={自身のアプリケーションID}&number= |
| Azure Application Insights             | `CUSTOMCONNSTR_APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Application Insightsの接続文字列                                                |

## 情報取得元明示
1. [国税庁　適格請求書発行事業者公表サイト](https://www.invoice-kohyo.nta.go.jp/index.html)

なお、国税庁　適格請求書発行事業者公表システムWeb-APIの使用にあたり、**このサービスは、国税庁適格請求書発行事業者公表システムのWeb-API機能を利用して取得した情報をもとに作成しているが、サービスの内容は国税庁によって保証されたものではない**ことをご留意ください。  

## ライセンス
MIT  
Copyright (c) 2023-2024 Lotus
