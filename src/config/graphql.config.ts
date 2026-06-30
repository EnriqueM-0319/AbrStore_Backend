import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { join } from 'node:path';

const isProduction = process.env.NODE_ENV === 'production';

export const graphqlModule = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
  sortSchema: true,
  playground: false,
  introspection: !isProduction,
  plugins: isProduction ? [] : [ApolloServerPluginLandingPageLocalDefault()],
});
