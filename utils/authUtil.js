// Regex me ham kisi string ka format bhi check kr sakhte 

const isEmailValidator = ({ key }) => {
    const isEmail =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(
            key
        );
    return isEmail;
};


const userDataValidation = ({ name, email, username, password }) => {
    return new Promise((resolve, reject) => {
        //if (!name || !email || !username || !password) reject("Missing user data");
        // if some fiedd missing
        if(!name) reject("name is missing");
        if(!email) reject("email is missing");
        if(!username) reject("username is missing");
        if(!password) reject("password is missing");

        // if data is not in the form of text
        if (typeof name !== 'string') reject("name is not a text");
        if (typeof email !== 'string') reject("email is not a text");
        if (typeof username !== 'string') reject("username is not a text");
        if (typeof password !== 'string') reject("password is not a text");

        // length checks
        if (username.length < 3 || username.length > 20) reject("username length should be between 3 - 20 chars");
        if (password.length < 5 || password.length > 16) reject("password length should be between 5 - 16 chars");
        if (name.length < 3 || name.length > 30) reject("name length should be between 3 - 30 chars");

        // email check (email email format me h ya nahi)
        if (!isEmailValidator({ key: email })) reject("Email format is incorrect");

        resolve();
    });
};

module.exports = { userDataValidation, isEmailValidator };
