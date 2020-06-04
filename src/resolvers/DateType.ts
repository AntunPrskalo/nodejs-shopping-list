import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

const DateType = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
        return new Date(value); 
    },
    serialize(value) {
        return new Date(value); 
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
            return parseInt(ast.value, 10);
        }
        return null;
    }
})

export { DateType }