// src/helpers/filebase.js

import AWS from 'aws-sdk';

const filebaseKey = process.env.NEXT_PUBLIC_FILEBASE_KEY;
const filebaseSecret = process.env.NEXT_PUBLIC_FILEBASE_SECRET;
const filebaseBucket = process.env.NEXT_PUBLIC_FILEBASE_BUCKETNAME;
const filebaseGateway = process.env.NEXT_PUBLIC_FILEBASE_GATEWAY;

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  accessKeyId: filebaseKey,
  secretAccessKey: filebaseSecret,
  endpoint: 'https://s3.filebase.com',
  region: 'us-east-1',
  s3ForcePathStyle: true
});

export const uploadJsonToS3 = async (jsonObject, fileName) => {
  try {
    const jsonContent = JSON.stringify(jsonObject);
    const body = Buffer.from(jsonContent);

    const params = {
      Bucket: filebaseBucket,
      Key: fileName,
      ContentType: 'application/json',
      Body: body,
      ACL: 'public-read', // Upewniamy się, że obiekty są publicznie odczytywalne
    };
    const upload = await s3.putObject(params).promise();
    const CID = upload.$response.httpResponse.headers["x-amz-meta-cid"];
    return `${filebaseGateway}/${CID}`;
  } catch (error) {
    console.error('Error uploading JSON to Filebase:', error);
    // Logujemy cały obiekt błędu dla lepszej diagnostyki
    console.error('Full JSON upload error object from Filebase:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new Error(`Failed to upload JSON: ${error.message}`);
  }
};

export const uploadImageToS3 = async (fileName, file) => {
  try {
    const params = {
      Bucket: filebaseBucket,
      Key: fileName,
      ContentType: file.type,
      Body: file,
      ACL: 'public-read', // Upewniamy się, że obiekty są publicznie odczytywalne
    };

    const upload = await s3.putObject(params).promise();
    const CID = upload.$response.httpResponse.headers["x-amz-meta-cid"];
    return `${filebaseGateway}/${CID}`;
  } catch (error) {
    console.error('Error uploading image to Filebase:', error);
    // Logujemy cały obiekt błędu dla lepszej diagnostyki
    // Używamy Object.getOwnPropertyNames(error), aby złapać więcej właściwości, w tym niemutowalne
    console.error('Full image upload error object from Filebase:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};