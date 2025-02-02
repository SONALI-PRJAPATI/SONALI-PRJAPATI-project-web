var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require('./multer');
passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{nav:false});
});

router.get('/register', function(req, res, next) {
  res.render('register',{nav:false});
});

router.get('/profile',isLoggedin, async function(req, res, next) {
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("profile",{user,nav:true});
});

router.get('/show/posts',isLoggedin, async function(req, res, next) {
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("show",{user,nav:true});
});

router.get('/feed',isLoggedin, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")
  res.render("feed",{user , posts ,nav:true});
});
router.get('/add',isLoggedin, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add",{user,nav:true});
});

router.post('/createpost',isLoggedin, upload.single("postimage"), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

router.post('/fileupload',isLoggedin, upload.single("image"), async function(req, res, next) {
 const user = await userModel.findOne({username: req.session.passport.user});// use bande ko dekho jo logdin hai  or user ka name store hota h
 user.profileImage =req.file.filename;// jo img upload ki hai uska name req.file.filename save hota h
 await user.save();
 res.redirect("/profile");
});

router.post('/register', function(req, res, next) {
  const data = new userModel({
    username: req.body.username,
    name: req.body.lastname,
    email: req.body.email,
    contact: req.body.contact
    
  })
  userModel.register(data, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })

});

router.post('/login',passport.authenticate("local",{
   failureRedirect: "/",
   successRedirect: "/profile",

}),function(req, res, next) {
});

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/delete/:id', async (req, res) => {
  try {
    const deletedPost = await postModel.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).send('Post not found');
    }
    console.log("Post successfully deleted");
    res.redirect("/profile"); // Or any other appropriate redirect
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting post');
  }
});


function isLoggedin(req,res,next){
  if(req.isAuthenticated()){
     return next();
  }
  res.redirect("/");
}
module.exports = router;
