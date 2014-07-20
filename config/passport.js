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


// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log('serialize::user:')
	   console.log(user);
		done(null, user.user_id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {

		connection.query("select * from tbl_user_login where user_id = "+id,function(err,rows){
              console.log('deserialize::rows:');
		      console.log(rows);
			done(err, rows[0]);
		
		});
		/*User.findById(id, function(err, user) {
         
			done(err, user);
        });*/
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
		// find a user whose email is the same as the forms email
        var spEmail = "'"+email+"'";
        var spPassword = "'"+password+"'";
        
        var userSignupSp = new sp('sp_user_signup');
        userSignupSp.add('1');
        userSignupSp.add('123');
        userSignupSp.add('1');
        userSignupSp.add(spEmail);
        userSignupSp.add(spPassword);
        userSignupSp.add('null');
        userSignupSp.add('null');
        
        connection.query(userSignupSp.call(), function(err,rows){
            if (err)
                return done(err);
            console.log(rows);
            
            if(rows[0][0].user_id == -1) {
                 return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }
            var newUser = new Object();
            newUser.email    = email;
            newUser.password = password;
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

         connection.query("select * from tbl_user_login where email = '"+email+"'",function(err,rows){
		
	
			if (err)
                return done(err);
			 if (!rows.length) {
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            } 
			
			// if the user is found but the password is wrong
            if (!( rows[0].password == password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
			
            // all is well, return successful user
            return done(null, rows[0]);			
		
		});
    }));

};
