const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} = require("graphql");
const { products } = require("../data/store");

/**
 * Solves Problem #3 (REST Over-Fetching) - "The GraphQL Way".
 *
 * Unlike REST's /api/v1/products/123 which ALWAYS returns all 50 fields,
 * here the CLIENT decides exactly what it wants in the query itself:
 *
 *   query {
 *     product(id: "1") {
 *       title
 *       price
 *     }
 *   }
 *
 * The server's resolver only computes/returns what was asked for -
 * no wasted bandwidth on description, inventory, vendor, etc.
 */

const InventoryType = new GraphQLObjectType({
  name: "Inventory",
  fields: {
    stock: { type: GraphQLInt },
    warehouse: { type: GraphQLString }
  }
});

const VendorType = new GraphQLObjectType({
  name: "Vendor",
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString }
  }
});

const ProductType = new GraphQLObjectType({
  name: "Product",
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    price: { type: GraphQLFloat },
    category: { type: GraphQLString },
    description: { type: GraphQLString },
    inventory: { type: InventoryType },
    vendor: { type: VendorType },
    rating: { type: GraphQLFloat },
    createdAt: { type: GraphQLString }
  }
});

const RootQuery = new GraphQLObjectType({
  name: "Query",
  fields: {
    product: {
      type: ProductType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (_, args) => products.find((p) => p.id === args.id) || null
    },
    products: {
      type: new GraphQLList(ProductType),
      args: { category: { type: GraphQLString } },
      resolve: (_, args) => {
        if (args.category) {
          return products.filter(
            (p) => p.category.toLowerCase() === args.category.toLowerCase()
          );
        }
        return products;
      }
    }
  }
});

const schema = new GraphQLSchema({ query: RootQuery });

module.exports = schema;
