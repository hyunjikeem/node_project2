const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('./schemas/user');
const Posts = require('./schemas/posts');
const Comments = require('./schemas/comments');
const authMiddleware = require('./middlewares/auth-middleware');

mongoose.connect('mongodb://test:test@localhost:27017/admin', {
  dbName:'dbtest',
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  ignoreUndefined: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const app = express();
const router = express.Router();

const postUsersSchema = Joi.object({
  nickname: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,}$')),
  password: Joi.string().required(),
});

  // 회원가입
router.post('/users', async (req, res) => {
  try {
    const { nickname, password } = await postUsersSchema.validateAsync(
      req.body
    );

    const existUsers = await User.find({
      nickname,
    });
    if (existUsers.length) {
      res.status(400).send({
        errorMessage: '이미 존재하는 닉네임입니다.',
      });
      return; 
    }

    if (password.search(nickname) > -1) {
      res.status(400).send({
        errorMessage: '비밀번호에 닉네임이 포함되었습니다.',
      });
      return;
    }

    if (password.length < 4) {
      res.status(400).send({
        errorMessage: '비밀번호는 4자이상 입력해주세요.',
      });
      return;
    }

    const recentUserId = await User.find().sort('-userId').limit(1);
    let userId = 1;
    if (recentUserId.length !== 0) {
      userId = recentUserId[0]['userId'] + 1; 
    }

    let createdAt = new Date();

    const user = new User({ createdAt, nickname, password, userId });
    await user.save();

    res.status(201).send({}); 
  } catch (err) {
    console.log(err);
    res.status(400).send({
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

const postAuthSchema = Joi.object({
  nickname: Joi.string().required(),
  password: Joi.string().required(),
});

  // 로그인 (토큰발급)
router.post('/auth', async (req, res) => {
  try {
    const { nickname, password } = await postAuthSchema.validateAsync(req.body);

    const user = await User.findOne({ nickname, password }).exec();

    if (!user) {
      res.status(400).send({
        errorMessage: '닉네임 또는 패스워드를 확인해주세요.',
      });
      return;
    }

    const token = jwt.sign({ userId: user.userId }, 'my-secret-key');
    res.send({
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(400).send({
      errorMessage: '요청한 데이터 형식이 올바르지 않습니다.',
    });
  }
});

router.get('/users/me', authMiddleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user, 
  });
});

router.get('/posts', async (req, res) => {
  const post = await Posts.find({}).sort('-postId'); 
  res.json(post);
});

  // 게시글 등록
router.post('/posts', authMiddleware, async (req, res) => {
  const { nickname, userId } = res.locals.user;
  const { title, content } = req.body;
  const recentList = await Posts.find().sort('-postId').limit(1); 
  let postId = 1;

  if (recentList.length !== 0) {
    postId = recentList[0]['postId'] + 1; 
  }

  let createdAt = new Date();
  let updatedAt = new Date();

  const post = new Posts({
    content,
    createdAt,
    nickname,
    postId,
    title,
    updatedAt,
    userId,
  });
  await post.save();
  res.status(201).send({});
});

  // 게시물 상세페이지
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    let posts = await Posts.findOne({ postId });
    res.json(posts);
  } catch (err) {
    console.error(err);
  }
});

  // 댓글 등록
router.post('/comments/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { nickname, userId } = res.locals.user;
  const { comment } = req.body;
  const recentComment = await Comments.find().sort('-commentId').limit(1); 
  let commentId = 1;
  if (recentComment.length !== 0) {
    commentId = recentComment[0]['commentId'] + 1; 
  }

  let createdAt = new Date();
  let updatedAt = new Date();

  const comments = new Comments({
    comment,
    commentId,
    createdAt,
    nickname,
    updatedAt,
    userId,
    postId,
  });
  await comments.save();
  res.status(201).send({});
});

  // 해당 게시글의 모든 댓글 조회
router.get('/comments/:postId', authMiddleware, async (req, res) => {
  try {
    let comments = await Comments.find({});

    res.json(comments);
  } catch (err) {
    console.error(err);
  }
});

  // 해당 게시글의 모든 댓글 조회
router.get('/comment/:postId', async (req, res) => {
  try {
    let comments = await Comments.find({});

    res.json(comments);
  } catch (err) {
    console.error(err);
  }
});

router.patch('/comments/:commentId', authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { commentId } = req.params;
  const { comment } = req.body;

  const existsComment = await Comments.findOne({
    userId,
    commentId,
  }).exec();

  existsComment.comment = comment;
  existsComment.updatedAt = new Date();
  await existsComment.save();

  res.send({});
});

router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { commentId } = req.params;

  const existsComment = await Comments.findOne({
    userId,
    commentId,
  }).exec();

  if (existsComment) {
    await existsComment.delete();
  }

  res.send({});
});

  // 전체 게시글 목록 조회
router.get('/post/:postId', authMiddleware, async (req, res) => {
  const post = await Posts.find({}).sort('-postId'); 
  res.json(post);
});

router.get('/modify/:postId', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    let posts = await Posts.findOne({ postId });
    res.json(posts);
  } catch (err) {
    console.error(err);
  }
});

router.patch('/modify/:postId', authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;
  const { title, content } = req.body;

  const existsPost = await Posts.findOne({ postId }).exec();

  existsPost.title = title;
  existsPost.content = content;
  existsPost.updatedAt = new Date();
  await existsPost.save();

  res.send({});
});

app.use('/api', express.urlencoded({ extended: false }), router);
app.use(express.static('assets'));

app.listen(3000, () => {
  console.log('서버가 요청을 받을 준비가 됐어요');
});
