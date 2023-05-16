import { ApolloServer, UserInputError, gql } from 'apollo-server';
import { v1 as uuid} from 'uuid';
import fetch from 'node-fetch';

const personas = [
  {
    name: "Nicolas",
    phone: "3415929292",
		street: 'Mendoza',
		city: 'Rosario',
		id: 'asdas-12312-qweqw'
  },
	{
    name: "Juan",
    phone: "3415919191",
		street: 'Valparaiso',
		city: 'Salta',
		id: 'lsdgs-12312-qweqw'
  },
	{
    name: "Pedro",
		street: 'Cordoba',
		city: 'Barcelona',
		id: 'asdas-12312-qwpkw'
  },
];

// Primero describimos los datos y las peticiones (type Query)

const typeDefinitions = gql`
	enum YesNo{
		YES
		NO
	}

	type Address {
		city: String!
		street: String!
	}

	type Person {
		name: String!
		phone: String
		address: Address!
		id: ID!
	}

	type Query {
		personCount: Int!
		allPersons(phone: YesNo): [Person]!
		findPerson(name: String!): Person
	}

	type Mutation {
		addPerson(
			name: String!
			phone: String
			street: String!
			city: String!
		): Person
		editNumber(
			name: String!
			phone: String!
		): Person
		deletePerson(
			id: String!
		): [Person]
	}
`

const resolvers = {
	Query: {
		personCount: () => personas.length,
		allPersons: async (_root, args) => {
			const response = await fetch('http://localhost:3000/persons');
			const personsFromApi = await response.json();

			if(!args.phone) return null;
			return personsFromApi.filter((persona) => args.phone === 'YES' ? persona.phone : !persona.phone)
		},
		// El root o prev puede aparecer, es el valor que tienen los datos antes de ejecutar ese metodo
		findPerson: (root, args) => {
			const {name} = args;
			return personas.find((persona) => persona.name === name);
		}
	},
	// Capa para mapear datos q devuelve con el nombre que nos gustaria o para generar campos dinamicos, ejemplo es mayor de edad. Previamente hay q definirlo
	// Person: {
	// 	address: (root) => `${root.city} - ${root.street}`
	// }
	Mutation: {
		addPerson: (_root, args) => {
			if(personas.find((person) => person.name === args.name)){
				throw new UserInputError('Nombre repetido', {
					invalidArgs: args.name
				})
			}
			const person = {...args, id: uuid()};
			personas.push(person);
			return person
		},
		editNumber: (_root, args) => {
			const personIndex = personas.find((persona) => persona.name === args.name)
			if(personIndex === -1) return null

			const person = personas[personIndex];
			const updatedPerson = {...person, phone: args.phone}
			personas[personIndex] = updatedPerson;
			return updatedPerson;
		},
		deletePerson: (_root, args) => personas.filter((person) => person.id !== args.id)
	},

	// o describimos campos nuevos para q los pueda resolver cuando los buscamos
	Person: {
		address: (root) => {
			return {
				street: root.street,
				city: root.city
			}
		}
	}
}

const server = new ApolloServer({
	typeDefs: typeDefinitions,
	resolvers
})

server.listen().then(({url}) => `server running on ${url}`)