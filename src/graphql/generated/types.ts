import { GraphQLResolveInfo } from 'graphql';
import { User as PrismaUser } from '@prisma/client';
import { MyContext } from 'src/types/index.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** Access token for authentication */
  accessToken: Scalars['String']['output'];
  /** Refresh token for refreshing access token when access token has expired */
  refreshToken: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type Categories = {
  __typename?: 'Categories';
  children: Array<Maybe<Categories>>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** A generic connection type, conforming to the Relay Cursor Connections Specification. */
export type Connection = {
  edges: Array<Edge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** Represents a single "edge" in a connection, connecting a node to a cursor. */
export type Edge = {
  cursor: Scalars['ID']['output'];
};

/** Describes a single file that the client wants to upload. */
export type FileUploadInfoInput = {
  /** A client-side identifier to match the response with the request. */
  customId?: InputMaybe<Scalars['String']['input']>;
  fileSize: Scalars['Int']['input'];
  fileType: Scalars['String']['input'];
};

export type FileUploadResponse = {
  __typename?: 'FileUploadResponse';
  customId?: Maybe<Scalars['String']['output']>;
  /** The final public URL of the file after a successful upload. */
  publicUrl: Scalars['String']['output'];
  /** The temporary, secure URL to use for the PUT request to upload the file. */
  uploadUrl: Scalars['String']['output'];
};

/**
 * A standard response for mutations that don't return a specific object.
 * Indicates the success status and provides a user-friendly message.
 */
export type GenericResponse = {
  __typename?: 'GenericResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  /** A user follow other user */
  followUser: GenericResponse;
  generateUploadUrl: Array<FileUploadResponse>;
  loginWithCode: AuthPayload;
  logout: GenericResponse;
  refreshToken: AuthPayload;
  sendEmailCode: GenericResponse;
  /** A user cancel to follow other user */
  unfollowUser: GenericResponse;
};


export type MutationFollowUserArgs = {
  followerId: Scalars['ID']['input'];
  followingId: Scalars['ID']['input'];
};


export type MutationGenerateUploadUrlArgs = {
  files: Array<FileUploadInfoInput>;
};


export type MutationLoginWithCodeArgs = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
};


export type MutationLogoutArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationSendEmailCodeArgs = {
  email: Scalars['String']['input'];
};


export type MutationUnfollowUserArgs = {
  followerId: Scalars['ID']['input'];
  followingId: Scalars['ID']['input'];
};

/** Contians information about page in a connection */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** The cursor of the last edge in the connection. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Indicates if there are more pages when paginating forwards. */
  hasNextPage: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  categories: Categories;
  /** Get the currently authenticated user's profile. */
  me?: Maybe<User>;
  /** Get a user's profile by their ID. */
  user?: Maybe<User>;
};


export type QueryCategoriesArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  /** The total number of users that are following this user. */
  followerCount: Scalars['Int']['output'];
  /** A list of users that are following this user. */
  followers: UserConnection;
  /** A list of users that this user is following. */
  following: UserConnection;
  /** The total number of users that this user is following. */
  followingCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  /** Indicates if the currently authenticated user is following this user. */
  isFollowedByMe: Scalars['Boolean']['output'];
  name?: Maybe<Scalars['String']['output']>;
};


export type UserFollowersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};


export type UserFollowingArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first: Scalars['Int']['input'];
};

export type UserConnection = Connection & {
  __typename?: 'UserConnection';
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type UserEdge = Edge & {
  __typename?: 'UserEdge';
  cursor: Scalars['ID']['output'];
  node: User;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;


/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  Connection: ( Omit<UserConnection, 'edges'> & { edges: Array<_RefType['UserEdge']> } );
  Edge: ( Omit<UserEdge, 'node'> & { node: _RefType['User'] } );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Categories: ResolverTypeWrapper<Categories>;
  Connection: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Connection']>;
  Edge: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Edge']>;
  FileUploadInfoInput: FileUploadInfoInput;
  FileUploadResponse: ResolverTypeWrapper<FileUploadResponse>;
  GenericResponse: ResolverTypeWrapper<GenericResponse>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  User: ResolverTypeWrapper<PrismaUser>;
  UserConnection: ResolverTypeWrapper<Omit<UserConnection, 'edges'> & { edges: Array<ResolversTypes['UserEdge']> }>;
  UserEdge: ResolverTypeWrapper<Omit<UserEdge, 'node'> & { node: ResolversTypes['User'] }>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AuthPayload: AuthPayload;
  Boolean: Scalars['Boolean']['output'];
  Categories: Categories;
  Connection: ResolversInterfaceTypes<ResolversParentTypes>['Connection'];
  Edge: ResolversInterfaceTypes<ResolversParentTypes>['Edge'];
  FileUploadInfoInput: FileUploadInfoInput;
  FileUploadResponse: FileUploadResponse;
  GenericResponse: GenericResponse;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Mutation: {};
  PageInfo: PageInfo;
  Query: {};
  String: Scalars['String']['output'];
  User: PrismaUser;
  UserConnection: Omit<UserConnection, 'edges'> & { edges: Array<ResolversParentTypes['UserEdge']> };
  UserEdge: Omit<UserEdge, 'node'> & { node: ResolversParentTypes['User'] };
};

export type AuthDirectiveArgs = { };

export type AuthDirectiveResolver<Result, Parent, ContextType = MyContext, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AuthPayloadResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoriesResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Categories'] = ResolversParentTypes['Categories']> = {
  children?: Resolver<Array<Maybe<ResolversTypes['Categories']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Connection'] = ResolversParentTypes['Connection']> = {
  __resolveType: TypeResolveFn<'UserConnection', ParentType, ContextType>;
  edges?: Resolver<Array<ResolversTypes['Edge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
};

export type EdgeResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Edge'] = ResolversParentTypes['Edge']> = {
  __resolveType: TypeResolveFn<'UserEdge', ParentType, ContextType>;
  cursor?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type FileUploadResponseResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['FileUploadResponse'] = ResolversParentTypes['FileUploadResponse']> = {
  customId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  publicUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenericResponseResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['GenericResponse'] = ResolversParentTypes['GenericResponse']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  followUser?: Resolver<ResolversTypes['GenericResponse'], ParentType, ContextType, RequireFields<MutationFollowUserArgs, 'followerId' | 'followingId'>>;
  generateUploadUrl?: Resolver<Array<ResolversTypes['FileUploadResponse']>, ParentType, ContextType, RequireFields<MutationGenerateUploadUrlArgs, 'files'>>;
  loginWithCode?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginWithCodeArgs, 'code' | 'email'>>;
  logout?: Resolver<ResolversTypes['GenericResponse'], ParentType, ContextType, RequireFields<MutationLogoutArgs, 'refreshToken'>>;
  refreshToken?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'refreshToken'>>;
  sendEmailCode?: Resolver<ResolversTypes['GenericResponse'], ParentType, ContextType, RequireFields<MutationSendEmailCodeArgs, 'email'>>;
  unfollowUser?: Resolver<ResolversTypes['GenericResponse'], ParentType, ContextType, RequireFields<MutationUnfollowUserArgs, 'followerId' | 'followingId'>>;
};

export type PageInfoResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  categories?: Resolver<ResolversTypes['Categories'], ParentType, ContextType, Partial<QueryCategoriesArgs>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
};

export type UserResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  followerCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  followers?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<UserFollowersArgs, 'first'>>;
  following?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<UserFollowingArgs, 'first'>>;
  followingCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isFollowedByMe?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserConnectionResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['UserConnection'] = ResolversParentTypes['UserConnection']> = {
  edges?: Resolver<Array<ResolversTypes['UserEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserEdgeResolvers<ContextType = MyContext, ParentType extends ResolversParentTypes['UserEdge'] = ResolversParentTypes['UserEdge']> = {
  cursor?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = MyContext> = {
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  Categories?: CategoriesResolvers<ContextType>;
  Connection?: ConnectionResolvers<ContextType>;
  Edge?: EdgeResolvers<ContextType>;
  FileUploadResponse?: FileUploadResponseResolvers<ContextType>;
  GenericResponse?: GenericResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserConnection?: UserConnectionResolvers<ContextType>;
  UserEdge?: UserEdgeResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = MyContext> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
};
