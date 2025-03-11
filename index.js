let x;

const person ={
    name: 'Jacob Weiss',
    age: 28,
    isAdmin: true,
    address: {
        street: '18 Pulaski St',
        city: 'Brooklyn',
        state: 'NY'
    },
    hobbies: ['Music', 'Watching']
}

x = person.name;
x = person['age']
x = person.address.city;
x = person.hobbies;

person.name = 'John Doe'
person.isAdmin = false

//delete person.age;

console.log(person)





