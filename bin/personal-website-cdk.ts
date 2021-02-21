#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PersonalWebsiteCdkStack } from '../lib/personal-website-cdk-stack';

const defaultEnv  = { account: '545377574896', region: 'us-east-1' };

const app = new cdk.App();
new PersonalWebsiteCdkStack(app, 'PersonalWebsiteCdkStack',{
    env:defaultEnv
});
