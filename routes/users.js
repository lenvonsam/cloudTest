var express = require('express');
var AV = require('leanengine');
var router = express.Router();


router.get('/login', function(req, res, next) {
  var UserTypeID = req.query.UserTypeID;
  if(UserTypeID == undefined) {
    res.render('users/login',{title:'用户登录',errMsg:'地址不正确',UserTypeID:''});
  } else {
    res.cookie('userTypeId',UserTypeID,{maxAge:3600000});
    res.cookie('pageIndex',"0",{maxAge:600000});
    res.render('users/login', {title: '用户登录', errMsg: '',UserTypeID:UserTypeID});
  }
});

router.post('/login', function(req, res, next) {
  var usr = req.body.user;
  var userTypeID = req.cookies.userTypeId;
  var pageIndex = req.cookies.pageIndex;
  console.log('user.moblie:'+usr.MobileNo+';password:'+usr.LoginPwd+";userType:"+usr.UserTypeID+";default value:"+usr.SchoolID);
  if(usr.MobileNo == undefined) {
    res.render('users/login',{title:'用户登录',errMsg:'手机号不能为空',UserTypeID:userTypeID});
  }

  if(usr.LoginPwd == undefined) {
    res.render('users/login',{title:'用户登录',errMsg:'密码不能为空',UserTypeID:userTypeID});
  }

  if(usr.MobileNo.length>0 && usr.LoginPwd.length>0) {
   AV.Cloud.httpRequest({
   url:'http://218.93.126.104:5657/Login/',
   params: {
     MobileNo : usr.MobileNo,
     LoginPwd : usr.LoginPwd,
     UserTypeID : usr.UserTypeID,
     SchoolID : usr.SchoolID
     },
   success: function(httpResponse) {
      console.log("user login response:"+httpResponse.text);
       var jsonResult = JSON.parse(httpResponse.text);

       var code = jsonResult.code.type;
       var errMsg = getErrMsg(code);
       if(code == 0) {
        console.log('login success');
        var url = getUrl(pageIndex);
        var responseResult = jsonResult.result[0];
        res.cookie('LoginID',responseResult.LoginID,{maxAge:3600000});
        res.cookie('UserName',responseResult.UserName,{maxAge:3600000});
        res.cookie('MobileNo',responseResult.MobileNo,{maxAge:3600000});
        res.cookie('ClassID',responseResult.ClassID,{maxAge:3600000});
        res.cookie('GradeID',responseResult.GradeID,{maxAge:3600000});
        res.cookie('SchoolID',responseResult.SchoolID,{maxAge:3600000});
        res.cookie('GroupID',responseResult.GroupID,{maxAge:3600000});
        res.cookie('SchoolName',responseResult.SchoolName,{maxAge:3600000});
        res.cookie('UserSubTypeID',responseResult.UserSubTypeID,{maxAge:3600000});
        console.log('url:'+url);
        res.redirect(url);
        // res.render('users/index',{title:'主页',errMsg:''});
       } else {
        res.render('users/login',{title:'用户登录',errMsg:errMsg}); 
       }
     },
   error: function(httpResponse) {
       console.error('Request failed with response code ' + httpResponse.status+';text:'+httpResponse.text);
       res.render('users/login',{title:'用户登录',errMsg:'网络超时'});
     }
  });
  }
});

//主页
router.get('/index',function(req,res,next){
  var username = req.cookies.UserName;
  var LoginID = req.cookies.LoginID;
  console.log('username:'+ username);
  AV.Cloud.httpRequest({
    url:'http://218.93.126.104:5657/Checkin/?',
    params:{
      LoginID: LoginID
    },success:function(data){
      console.log('get attendance list:'+data.text);

      var jsonResult = JSON.parse(data.text);
       var code = jsonResult.code.type;
       if(code==0) {
         var kList = jsonResult.result;
         res.render('users/index',{title:'主页',errMsg:'',kList:kList,UserName:username});
       } else {
        res.render('users/index',{title:'主页',errMsg:'',kList:[],UserName:username});
       }

    },
    error:function(data){
      res.render('users/login',{title:'用户登录',errMsg:'网络超时'});
    }
  });
});


//我的考勤列表
router.get('/myAttendance',function(req,res,next){
  res.cookie('pageIndex',"1",{maxAge:600000});
  var LoginID = req.cookies.LoginID;
  if(LoginID == undefined) {
    var userTypeId = req.cookies.userTypeId;
    if(userTypeId == undefined) {
      res.redirect('pageNotFound'); 
    } else {
      var url = "/users/login?UserTypeID="+userTypeId;
      res.redirect(url);
    }
  } else {
    AV.Cloud.httpRequest({
      url:'http://218.93.126.104:5657/Checkin/?',
      params:{
        LoginID:LoginID
      },success:function(data){
        var jsonResult = JSON.parse(data.text);
        var code = jsonResult.code.type;
        if(code==0) {
          var kList = jsonResult.result;
          res.render('users/myAttendance',{title:'我的考勤',errMsg:'',kList:kList});
        } else {

          res.render('users/myAttendance',{title:'我的考勤',errMsg:getErrMsg(code),kList:[]});
        }
      },error:function(data){
        console.log('我的考勤error:'+data.status+";text:"+data.text);
        res.render('users/myAttendance',{title:'我的考勤',errMsg:'网络异常',kList:[]});
      }
    });
  }
});

//个人主页
router.get('/profile',function(req,res,next){
  var username = req.cookies.UserName;
  var mobile = req.cookies.MobileNo;
  var schoolName = req.cookies.SchoolName;
  var UserSubTypeID = req.cookies.UserSubTypeID;
  res.render('users/profile',{title:'个人主页',errMsg:'',username:username,mobile:mobile,schoolName:schoolName,userSubType:getAuthority(UserSubTypeID)});
});

//收件箱
router.get('/receiver',function(req,res,next){
  var page = req.query.currentPage;
  res.cookie('pageIndex',"2",{maxAge:600000});
  var LoginID = req.cookies.LoginID;
  if(LoginID==undefined){
    var userTypeId = req.cookies.userTypeId;
    if(userTypeId == undefined) {
      res.redirect('pageNotFound'); 
    } else {
      var url = "/users/login?UserTypeID="+userTypeId;
      res.redirect(url);
    }
  } else {
    AV.Cloud.httpRequest({
      url:"http://218.93.126.104:5657/Message/Inbox/?",
      params:{
        LoginID: LoginID,
        ClassID: req.cookies.ClassID,
        GradeID: req.cookies.GradeID,
        SchoolID: req.cookies.SchoolID,
        GroupID: req.cookies.GroupID,
        Index:page
      },success:function(data){
        var jsonResult = JSON.parse(data.text);
        var code = jsonResult.code.type; 
        var nextPage = 2;
        var prePage = 1;
        if(code == 0) {
          var last = jsonResult.code.last;
          var next = jsonResult.code.next;
          if(last==0) {
            prePage = 1;
          } else {
            prePage = Number(page) - 1;
          }

          if(next == 0) {
            nextPage = 1;
          } else {
            nextPage = Number(page) + 1;
          }
          var noticeList = jsonResult.result;
          res.render("users/receiver",{title:'收件箱',errMsg:'',nextPage:nextPage,prePage:prePage,noticeList:noticeList});
        } else {

          res.render("users/receiver",{title:'收件箱',errMsg:getErrMsg(code),nextPage:1,prePage:1,noticeList:[]});
        }

      },error:function(data){
        res.render("users/receiver",{title:"收件箱",errMsg:'网络异常',nextPage:1,prePage:1,noticeList:[]});
      }
    });
  }
});

//发件箱
router.get('/sender',function(req,res,next){
  console.log("发件箱:>>>");
  var page = req.query.currentPage;
  res.cookie('pageIndex',"3",{maxAge:600000});
    var LoginID = req.cookies.LoginID;
  if(LoginID==undefined){
    var userTypeId = req.cookies.userTypeId;
    if(userTypeId == undefined) {
      res.redirect('pageNotFound'); 
    } else {
      var url = "/users/login?UserTypeID="+userTypeId;
      res.redirect(url);
    }
  } else {
    AV.Cloud.httpRequest({
      url:"http://218.93.126.104:5657/Message/Outbox/?",
      params:{
        LoginID: LoginID,
        ClassID: req.cookies.ClassID,
        GradeID: req.cookies.GradeID,
        SchoolID: req.cookies.SchoolID,
        GroupID: req.cookies.GroupID,
        Index:page
      },success:function(data){
        var jsonResult = JSON.parse(data.text);
        var code = jsonResult.code.type; 
        console.log("发件箱返回数据:"+JSON.stringify(jsonResult));
        var nextPage = 2;
        var prePage = 1;
        if(code == 0) {
          var last = jsonResult.code.last;
          var next = jsonResult.code.next;
          if(last==0) {
            prePage = 1;
          } else {
            prePage = Number(page) - 1;
          }

          if(next == 0) {
            nextPage = 1;
          } else {
            nextPage = Number(page) + 1;
          }
          var noticeList = jsonResult.result;
          res.render("users/sender",{title:'发件箱',errMsg:'',nextPage:nextPage,prePage:prePage,noticeList:noticeList});
        } else {

          res.render("users/sender",{title:'发件箱',errMsg:getErrMsg(code),nextPage:1,prePage:1,noticeList:[]});
        }

      },error:function(data){
        res.render("users/sender",{title:"发件箱",errMsg:'网络异常',nextPage:1,prePage:1,noticeList:[]});
      }
    });
  }

});

//详细资料
router.get('/detail',function(req,res,next){
  var noticeId = req.query.noticeId;
  var LoginID = req.cookies.LoginID;
  if(LoginID==undefined){
    var userTypeId = req.cookies.userTypeId;
    if(userTypeId == undefined) {
      res.redirect('pageNotFound'); 
    } else {
      var url = "/users/login?UserTypeID="+userTypeId;
      res.redirect(url);
    }
  } else {
    AV.Cloud.httpRequest({
      url:'http://218.93.126.104:5657/Message/Detail/?',
      params:{
        LoginID:LoginID,
        NoticeID:noticeId,
        ClassID:req.cookies.ClassID,
        GradeID:req.cookies.GradeID,
        SchoolID:req.cookies.SchoolID,
        GroupID:req.cookies.GroupID
      },success:function(data){
        var jsonResult = JSON.parse(data.text);
        var code = jsonResult.code.type;
        if(code == 0) {
          var content = jsonResult.result[0];
          console.log("detailTitle:"+content.NoticeTitle+";detailContent:"+content.NoticeContent+";detailTime:"+content.SendTime);
          res.render('users/detail',{title:"详细资料",errMsg:'',detailTitle:content.NoticeTitle,detailContent:content.NoticeContent,detailTime:content.SendTime});
        } else {
          res.render('users/detail',{title:'详细资料',errMsg:getErrMsg(code)});
        }

      },error:function(data){
        res.render('users/detail',{title:'详细资料',errMsg:'网络异常'});
      }
    });
  }

});

router.get('/register', function(req, res, next) {
  var errMsg = req.query.errMsg;
  res.render('users/register', {title: '用户注册', errMsg: errMsg});
});

router.post('/register', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || username.trim().length == 0
    || !password || password.trim().length == 0) {
    return res.redirect('/users/register?errMsg=用户名或密码不能为空');
  }
  var user = new AV.User();
  user.set("username", username);
  user.set("password", password);
  user.signUp(null, {
    success: function(user) {
      res.redirect('/todos');
    },
    error: function(user, err) {
      res.redirect('/users/register?errMsg=' + JSON.stringify(err));
    }
  })
})

router.get('/logout', function(req, res, next) {
  AV.User.logOut();
  return res.redirect('/users/login');
})

module.exports = router;
