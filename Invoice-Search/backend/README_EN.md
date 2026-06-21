# Invoice Search Fast API
日本語版のREADME.mdは[こちら](./README.md)をご覧ください。  
English version of README.md is translated by OpenAI.  
<img src="assets/img/Invoice%20Search%20App-logo.png" width="50%">  

## Purpose of This Directory  
This directory is for an API that calls the National Tax Agency's Qualified Invoice Issuer Publication System Web-API in response to invoice numbers searched in the Invoice Search Web App, and then returns the search results to the Invoice Search Web App.  
Note that this directory is intended for deployment to Azure App Service.  

## Features and Cautions  
In order to call the National Tax Agency's Qualified Invoice Issuer Publication System Web-API, it is necessary to set the destination URL and the application ID.  
Please note that an application to the National Tax Agency is required for the application ID, so please apply from [here]("https://www.invoice-kohyo.nta.go.jp/web-api/index.html").  
Please be mindful to avoid excessive access to the API as it may cause inconvenience to the National Tax Agency.  

## Environment Variables
| Category                         | Key                                                   | Value                                                                            |
| -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| General                          | `VERSION`                                             | 1.0.0                                                                            |
| Qualified Invoice Issuer Web-API | `INVOICE_APP_ID`                                      | Your Application ID                                                              |
| Qualified Invoice Issuer Web-API | `INVOICE_API_URL`                                     | https://web-api.invoice-kohyo.nta.go.jp/1/valid?id={Your Application ID}&number= |
| Azure Application Insights       | `CUSTOMCONNSTR_APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Application Insights Connection String                                     |


## Sources of Information  
1. [National Tax Agency Qualified Invoice Issuer Publication Site](https://www.invoice-kohyo.nta.go.jp/index.html)  

Please note that **the use of the National Tax Agency's Qualified Invoice Issuer Publication System Web-API is based on information obtained using the Web-API feature of the system, but the content of the service is not guaranteed by the National Tax Agency.**  

## LICENSE
MIT  
Copyright (c) 2023-2024 Lotus
