import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';

const websiteSourcePath = '../personal-website-front-end';
const domainName = 'akshaypalekar.com';
const siteSubDomain = 'www';
const siteDomain = siteSubDomain + "." + domainName;

export class PersonalWebsiteCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================================================================================
    // Create Bucket
    // =====================================================================================
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index-dark.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

    // =====================================================================================
    // Lookup Hosted Zone
    // =====================================================================================
    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domainName });
    new cdk.CfnOutput(this, 'Site', { value: 'https://' + siteDomain });

    // =====================================================================================
    // TSL Certificate
    // =====================================================================================
    const certificateArn = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: siteDomain,
      hostedZone: zone,
      region: 'us-east-1', // Cloudfront only checks this region for certificates.
    }).certificateArn;
    new cdk.CfnOutput(this, 'Certificate', { value: certificateArn });

    // =====================================================================================
    // Create CloudFront distribution that provides HTTPS
    // =====================================================================================
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      defaultRootObject: 'index-dark.html',
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [siteDomain],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
      },
      originConfigs: [
        {
          customOriginSource: {
            domainName: siteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [{ isDefaultBehavior: true }],
        }
      ]
    });
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

    // =====================================================================================
    // Route53 alias record for the CloudFront distribution
    // =====================================================================================
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    // =====================================================================================
    // Deploy site contents to S3 bucket
    // =====================================================================================
    new s3Deployment.BucketDeployment(this, 'DeployWithInvalidation', {
      sources: [s3Deployment.Source.asset(websiteSourcePath)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}