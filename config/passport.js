// config/passport.js
				
// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
// var User       		= require('../app/models/user');
var mysql = require('mysql');
                  // database: 'stubeesc_gandalfdb',
var connection = mysql.createConnection({
                  host: 'box907.bluehost.com',
                  user: 'stubeesc_admin',
                  password: 'belakusql!@#$',
                  database: 'stubeesc_sparkk',
                  port: '3306'});


connection.query('USE stubeesc_sparkk'); 

var sp = require('sparkk-lib/store-procedure');
var hasher = require('sparkk-lib/hasher');


// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // Used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("Serializing User : "+user.user_id);
        done(null, user.user_id);
    });

    // Used to deserialize the user
    passport.deserializeUser(function(id, done) {
        var user = {};
        user.user_id = id;

        console.log("Deserializing User : "+id);
        done(null, user);
    });

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        console.log('email:'+email+'\npassword:'+password+'\n');
        console.log(req.body);
		
        var hash = new hasher();
        var hashedpwd = hash.createHashedPassword(password);
        // var hashedpwd = password;
        var spGender = 1;
        var spDate = "1988-09-30";
        var spLocation = 1;
        var spEmail = email;
        var spPassword = hashedpwd;
        var spVerify = "thisismyverify";
        var spFBUser = 0;

        var userSignupSp = new sp('sp_user_signup');
        userSignupSp.add(spGender,false);            // Gender - (1:Male 2:Female)
        userSignupSp.add(spDate,true);               // DOB - (28-11-1986)
        userSignupSp.add(spLocation,false);          // Location - (Refer tbl_location for IDs)
        userSignupSp.add(spEmail,true);              // email id
        userSignupSp.add(spPassword,true);           // password
        userSignupSp.add(spVerify,true);             // Verify_UUID - (UUID for email verification)
        userSignupSp.add(spFBUser,false);            // FB_user - (0-False 1-True)
        
        connection.query(userSignupSp.call(), function(err,rows){
            if (err)
                return done(err);
            console.log(rows);
            
            // handle error during signup
            if(rows[0][0].user_id == -1) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }
            var newUser = {};
            newUser.user_id = rows[0][0].user_id;
            console.log('id is:'+newUser.user_id);
            return done(null, newUser);
        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        var userLoginSp = new sp('sp_user_auth');
        var spEmail = "'"+email+"'";
        var spPassword = "'"+password+"'";
    
        userLoginSp.add(spEmail);
        
        connection.query(userLoginSp.call(), function(err,rows){
			if (err)
                return done(err);

            console.log('login rows:');
            console.log(rows);
            loggedInUserId = rows[0][0].user_id;
            dbPwd = rows[0][0].password;
            var hash = new hasher();

            // Handle errors in db
            if(password == "invalid" || loggedInUserId == "-1") {
                return done(null, false, req.flash('loginMessage', 'Bad access to database, try again.'));
            }

            var isValidPassword = hash.validatePassword(password, dbPwd);
            console.log("Is password valid: "+isValidPassword);
            
            // Handle wrong email or password
            if(!isValidPassword) {
                return done(null, false, req.flash('loginMessage', 'The Email or Password provided is wrong.'));
            }

  //           // After user is successfully logged in, get his details
  //           var rows = getUserProfile(loggedInUserId);        

            var loggedInUser = {};
            loggedInUser.user_id = loggedInUserId;
            console.log('id is:'+loggedInUser.user_id);

            // all is well, return successful user
            return done(null, loggedInUser);			
		
		});

    }));

    function getUserProfile (loggedInUserId) {
        console.log('Inside getuserprofile function');
        var getUserProfileSp = new sp('sp_get_user_profile');
        getUserProfileSp.add(loggedInUserId, false);
        connection.query(getUserProfileSp.call(), function(err,rows){
            if(err)
                return err;
            console.log(rows);
            return rows[0];
        }); 
    }
};
