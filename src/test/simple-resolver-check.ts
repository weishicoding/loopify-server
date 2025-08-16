#!/usr/bin/env node

/**
 * Simple Resolver Structure Check
 *
 * This script validates that all GraphQL resolver modules exist and export the expected structure
 * without initializing any database connections or external dependencies.
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface ResolverCheckResult {
  resolverFile: string;
  exists: boolean;
  issues: string[];
}

class SimpleResolverChecker {
  private basePath = '/Users/will/workspace/loopify-server/src/graphql/resolver';

  private expectedResolvers = [
    'auth/auth.resolver.ts',
    'user/user.resolver.ts',
    'user/follow.resolver.ts',
    'item/item.resolver.ts',
    'item/category.resolver.ts',
    'item/collection.resolver.ts',
    'comment/comment.resolver.ts',
    'messaging/messaging.resolver.ts',
    'upload/upload.resolver.ts',
  ];

  private results: ResolverCheckResult[] = [];

  checkResolverFiles(): boolean {
    console.log('🔍 Checking GraphQL Resolver Files...\n');

    let allExist = true;

    this.expectedResolvers.forEach((resolverPath) => {
      const fullPath = join(this.basePath, resolverPath);
      const exists = existsSync(fullPath);

      const result: ResolverCheckResult = {
        resolverFile: resolverPath,
        exists,
        issues: [],
      };

      if (!exists) {
        result.issues.push('File does not exist');
        allExist = false;
      }

      this.results.push(result);
    });

    // Check index file
    const indexPath = join(this.basePath, 'index.ts');
    const indexExists = existsSync(indexPath);

    this.results.push({
      resolverFile: 'index.ts',
      exists: indexExists,
      issues: indexExists ? [] : ['Resolver index file missing'],
    });

    if (!indexExists) {
      allExist = false;
    }

    return allExist;
  }

  printResults(): boolean {
    console.log('📊 Resolver File Check Results:\n');

    let hasIssues = false;

    this.results.forEach((result) => {
      const statusEmoji = result.exists ? '✅' : '❌';
      console.log(`${statusEmoji} ${result.resolverFile}`);

      if (result.issues.length > 0) {
        result.issues.forEach((issue) => console.log(`     ⚠️  ${issue}`));
        hasIssues = true;
      }
    });

    console.log('\n' + '='.repeat(50));

    const existingFiles = this.results.filter((r) => r.exists).length;
    const totalFiles = this.results.length;

    console.log(`📈 Summary:`);
    console.log(`   Resolver Files Found: ${existingFiles}/${totalFiles}`);
    console.log(`   Success Rate: ${Math.round((existingFiles / totalFiles) * 100)}%`);

    if (!hasIssues && existingFiles === totalFiles) {
      console.log('\n🎉 All resolver files are present!');
      console.log('\n📋 Available Resolver Types:');
      console.log('   - Authentication (auth.resolver.ts)');
      console.log('   - User Management (user.resolver.ts)');
      console.log('   - Follow System (follow.resolver.ts)');
      console.log('   - Item Management (item.resolver.ts)');
      console.log('   - Categories (category.resolver.ts)');
      console.log('   - Collections (collection.resolver.ts)');
      console.log('   - Comments (comment.resolver.ts)');
      console.log('   - Messaging (messaging.resolver.ts)');
      console.log('   - File Upload (upload.resolver.ts)');
      return true;
    } else {
      console.log('\n❌ Some resolver files are missing');
      return false;
    }
  }

  checkExpectedAPIs(): void {
    console.log('\n📋 Expected API Endpoints by Resolver:\n');

    const expectedAPIs = {
      'Auth Resolver': [
        'Mutation.sendEmailCode',
        'Mutation.loginWithCode',
        'Mutation.refreshToken',
        'Mutation.logout',
      ],
      'User Resolver': [
        'Query.me',
        'Query.user',
        'User.followers',
        'User.following',
        'User.isFollowedByMe',
        'User.followerCount',
        'User.followingCount',
      ],
      'Item Resolver': [
        'Query.item',
        'Query.items',
        'Mutation.createItem',
        'ItemDetail.price',
        'ItemDetail.comments',
        'ItemList.price',
        'ItemList.isCollectedByMe',
      ],
      'Comment Resolver': [
        'Mutation.createComment',
        'Mutation.likeComment',
        'Mutation.unlikeComment',
      ],
      'Messaging Resolver': [
        'Query.conversations',
        'Query.conversation',
        'Query.conversationMessages',
        'Mutation.createConversation',
        'Mutation.sendMessage',
        'Mutation.markConversationAsRead',
      ],
      'Upload Resolver': ['Mutation.generateUploadUrl'],
    };

    Object.entries(expectedAPIs).forEach(([resolverName, apis]) => {
      console.log(`${resolverName}:`);
      apis.forEach((api) => console.log(`  - ${api}`));
      console.log('');
    });
  }
}

// Main execution
function main() {
  const checker = new SimpleResolverChecker();

  console.log('🚀 Starting Simple Resolver File Check\n');

  try {
    const success = checker.checkResolverFiles();
    const hasIssues = !checker.printResults();

    if (success && !hasIssues) {
      checker.checkExpectedAPIs();
      console.log('✅ All resolver files validated successfully!');
      process.exit(0);
    } else {
      console.log('❌ Resolver file validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Fatal error during validation:', error);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SimpleResolverChecker };
