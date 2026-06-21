# Invoice Search React App
日本語版のREADME.mdは[こちら](./README.md)をご覧ください。  
English version of README.md is translated by OpenAI.  
<img src="src/assets/img/Invoice%20Search%20App-logo.png" width="50%">  

## Purpose of This Directory  
This directory is a React app that enables single and multiple invoice number searches, as well as the verification of invoice number integrity through CSV file uploads.    
Note that this directory is intended for deployment to Azure App Service.  
  
## Environment Variables  
| Category         | Key                  | Value                   |   
| ---------------- | -------------------- | ----------------------- |   
| .env.development | `VITE_APP_API_URL` | http://localhost:8000/  |   
| .env.production  | `VITE_APP_API_URL` | URL of Fast API         |   
  
## How to Use  
### Single and Multiple Search Mode  
1. Enter the invoice number(s) you want to search in the text input field and click the "Search" button.  
2. The results will be displayed in a table. If there are any entries you wish to remove, click the "Delete Data" button. If everything is correct, click the "Download" button to download the results.  
  
### Integrity Search Mode  
1. Upload the CSV containing the invoice numbers you wish to verify and click the "Verify" button.  
2. If there are discrepancies between the company names and addresses in the CSV file and the API search results, an "✕" will be displayed in the "Consistency with Original Data" column of the table. If you want to merge the results from the API search, click the merge icon in the "Merge" column to perform the merge.  
  
## Notes  
### Precautions for Uploading CSV Files  
When uploading CSV files, please include a header in the first row and the data in the following rows. The header columns should be "Invoice Number, Company Name, Address" from left to right, and please delete any other columns.  

## LICENSE
MIT  
Copyright (c) 2023-2024 Lotus
