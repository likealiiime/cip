var Dog = new Class({
    Extends: CIObject,
    initialize: function(configuration) {
        this.parent(configuration);
        this.isA('Dog');
        this.synthesize({
            age: 1,
            sex: 'male',
            bark: 'Woof!'
        }, configuration);
    }
});

var dog = new Dog({
    sex: 'female',
    bark: 'Arf!!'
});
dog.setSex('male');
console.log(dog.sex);
dog.set('bark', 'Ruff!');
console.log(dog.getBark());
console.log(dog.getAge());