var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var methodOverride = require('method-override')
var cookieParser = require('cookie-parser')
var multer = require('multer'); 
var AV = require('leanengine');


var users = require('./routes/users');
var todos = require('./routes/todos');
var cloud = require('./cloud');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/static', express.static('public'));

// 加载云代码方法
app.use(cloud);

// 加载 cookieSession 以支持 AV.User 的会话状态
app.use(AV.Cloud.CookieSession({ secret: '05XgTktKPMkU', maxAge: 3600000, fetchUser: true }));

// 强制使用 https
app.enable('trust proxy');
app.use(AV.Cloud.HttpsRedirect());

app.use(methodOverride('_method'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer()); // for parsing multipart/form-data
// cookieParser()
app.use(cookieParser());



// 可以将一类的路由单独保存在一个文件中
// app.use('/todos', todos);
app.use('/users', users);


app.get('/pageNotFound',function(req,res){
  res.render('pageNotFound',{'title':'404'});
})

app.get('/', function(req, res) {
  res.redirect('/pageNotFound');
})

//获取交易返回错误信息
getErrMsg = function(returnCode) {
  switch(returnCode) {
    case "0":
      return "操作成功";
      break;
    case "1":
      return "操作失败";
      break;
    case "2":
      return "上传格式无法解析";
      break;
    case "3":
      return "输入参数不符规格或超限";
      break;
    default:
      return "接口内部故障";
      break;

  }

}

//根据访问页面的顺序,返回跳转的url
getUrl = function(index) {
  switch(index) {
    case "0":
      return "/users/index";
      break;
    case "1":
      return "/users/myAttendance";
      break;
    case "2":
      return "/users/receiver?currentPage=1";
      break;
    case "3":
      return "/users/sender?currentPage=1";
      break;
    default:
      return "/";
      break;
  }
}

//公告级别
getNoticeLevel = function(level) {
  switch(level) {
    case "1":
      return "私信留言";
      break;
    case "2":
      return "班级";
      break;
    case "3":
      return "年级";
      break;
    default:
      return "学校";
      break;
  }
}

//根据用户权限返回用户职位
getAuthority = function(val) {
  switch(val){
    case "1":
      return "学生";
      break;
    case "2":
      return "任课老师";
      break;
    case "3":
      return "班主任";
      break;
    case "4":
      return "年级主任";
      break;
    default:
      return "学校管理员";
      break;
  }
  
}


// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// 如果是非开发环境，则页面只输出简单的错误信息
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
