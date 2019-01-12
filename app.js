require('dotenv').config();
import express from 'express';
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

//models
import Event from './models/event'
import User from './models/user'

const app = express();

// MIDDLEWARES
app.use(express.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }        

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input UserInput {
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
           return Event.find()
            .then(events => {
                return events.map(event => {
                    return { ...event._doc, _id: event.id };
                })
            })
            .catch(err => {
                throw err;
            });
        },          
        createEvent: args => {
            const event = new Event({
              title: args.eventInput.title,
              description: args.eventInput.description,
              price: +args.eventInput.price,
              date: new Date(args.eventInput.date),
              creator: '5c385f27944a5b13f4ec29ef'
            });
            let createdEvent;
            return event
              .save()
              .then(result => {
                createdEvent = { ...result._doc, _id: result.id };
                return User.findById('5c385f27944a5b13f4ec29ef');
              })
              .then(user => {
                if (!user) {
                  throw new Error('User not found.');
                }
                user.createdEvents.push(event);
                return user.save();
              })
              .then(result => {
                return createdEvent;
              })
              .catch(err => {
                console.log(err);
                throw err;
              });      
        },        
        createUser: (args) => {
            return User.findOne({email: args.userInput.email})
                .then(user => {
                    if (user){
                        throw new Error('user exists already!');
                    }
                    return bcrypt.hash(args.userInput.password, 10)
                })            
                .then(hashedPassword => {
                    const newUser = new User({ 
                        email: args.userInput.email,
                        password: hashedPassword
                    })
                    return newUser.save()
                })
                .then(result => {
                    return {...result._doc, password: null, _id: result.id}
                })
                .catch(err => {
                    console.log(err);
                });
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-tpjjs.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`)
    .then(() => {   
        app.listen(3000, () => {
            console.log('runnning..')
        })
    }).catch(err => {
        console.error(err)
    })