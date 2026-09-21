(function (root) {
  'use strict';
  const source = (bookId, page, section) => ({ bookId, page, section });
  const q = (id, subject, prompt, options, answerIndex, explanation, goal, src) => ({
    id, subject, grade: 3, semester: 1, unitId: 'unit-1', type: 'single-choice',
    prompt, options, answerIndex, explanation, learningGoal: goal, source: src,
    reviewStatus: 'approved'
  });

  const pack = {
    schemaVersion: 1,
    packId: 'cn-primary-g3s1-first-units',
    contentVersion: '2026.09.16-a',
    title: '三年级上册 · 第一单元',
    units: [
      { id: 'unit-1', subject: 'chinese', grade: 3, semester: 1, label: '第一单元', title: '校园生活' },
      { id: 'unit-1', subject: 'math', grade: 3, semester: 1, label: '第一单元', title: '混合运算' },
      { id: 'unit-1', subject: 'english', grade: 3, semester: 1, label: 'Unit 1', title: 'Making friends' }
    ],
    books: [
      { id: 'cn-g3s1-pep-2026', subject: 'chinese', title: '义务教育教科书 语文 三年级上册', publisher: '人民教育出版社', sourceFile: '26秋·语文三年级上册电子课本(1).pdf' },
      { id: 'math-g3s1-bnu-2026', subject: 'math', title: '数学 三年级上册', publisher: '北京师范大学出版社', sourceFile: '26秋三年级上册北师大数学课本.pdf' },
      { id: 'en-g3s1-pep-2026', subject: 'english', title: '英语 三年级上册（PEP）', publisher: '人民教育出版社', sourceFile: '人教PEP版·英语三年级上册.pdf' }
    ],
    questions: [
      q('cn-u1-001','chinese','一场阵雨过后，泥土变得很____。',['湿润','粗壮','古老','热闹'],0,'“湿润”表示含有较多水分，适合描写雨后的泥土。','在语境中理解词语',source('cn-g3s1-pep-2026','6','第2课词语')),
      q('cn-u1-002','chinese','五星红旗在风中____。',['飘扬','排列','湿润','招引'],0,'旗帜在风中飘动，可以说“飘扬”。','正确搭配词语',source('cn-g3s1-pep-2026','2','第1课词语')),
      q('cn-u1-003','chinese','大树的枝干又高又____。',['粗壮','洁白','明朗','急忙'],0,'“粗壮”可以形容树干粗而结实。','在语境中理解词语',source('cn-g3s1-pep-2026','2','第1课词语')),
      q('cn-u1-004','chinese','上课铃响了，他____地跑进教室。',['急急忙忙','高高兴兴','闪闪发光','一本正经'],0,'赶时间、动作匆忙时，可以用“急急忙忙”。','在语境中选择恰当词语',source('cn-g3s1-pep-2026','5','第2课词语')),
      q('cn-u1-005','chinese','《大青树下的小学》中，不同民族的孩子来到学校后怎样相处？',['成为好朋友','互相不说话','各自在家学习','只和同族同学玩'],0,'课文写不同民族的小学生来到同一所学校，成为朋友，一起学习。','理解课文主要信息',source('cn-g3s1-pep-2026','2','第1课')),
      q('cn-u1-006','chinese','把花儿写成会跳舞、会去上学的孩子，这种写法让花儿显得怎样？',['活泼有趣','沉重可怕','十分安静','没有变化'],0,'把花儿当作孩子来写，使画面更活泼、更有想象力。','感受拟人化表达',source('cn-g3s1-pep-2026','5','第2课')),
      q('cn-u1-007','chinese','遇到不懂的问题，最合适的做法是什么？',['认真请教','假装明白','马上放弃','嘲笑提问的人'],0,'不懂就问能帮助我们弄清问题，提问前也可以先认真思考。','理解主动提问的学习态度',source('cn-g3s1-pep-2026','7','第3课')),
      q('cn-u1-008','chinese','《所见》中，牧童忽然停止歌唱，最可能是因为他想做什么？',['捕捉鸣蝉','回家吃饭','寻找黄牛','躲避大雨'],0,'诗中写牧童“意欲捕鸣蝉”，所以忽然闭口站立。','根据诗句理解行为原因',source('cn-g3s1-pep-2026','12','语文园地·日积月累')),
      q('cn-u1-009','chinese','《所见》的作者是谁？',['袁枚','杜牧','李白','苏轼'],0,'《所见》是清代诗人袁枚的作品。','识记古诗作者',source('cn-g3s1-pep-2026','12','语文园地·日积月累')),
      q('cn-u1-010','chinese','“牧童骑黄牛”描写的是谁？',['放牛的孩子','种花的老师','赶路的商人','捕鱼的老人'],0,'“牧童”指放牧牛羊的儿童。','理解古诗词语',source('cn-g3s1-pep-2026','12','语文园地·日积月累')),

      q('math-u1-001','math','计算 6＋3×4，结果是多少？',['18','36','24','15'],0,'有乘法又有加法，先算3×4＝12，再算6＋12＝18。','掌握乘加运算顺序',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-002','math','计算 20－3×4，结果是多少？',['8','68','12','17'],0,'先算3×4＝12，再算20－12＝8。','掌握乘减运算顺序',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-003','math','计算 5×3＋4，结果是多少？',['19','35','27','11'],0,'先算5×3＝15，再算15＋4＝19。','掌握乘加运算顺序',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-004','math','计算 4×6－20，结果是多少？',['4','16','44','28'],0,'先算4×6＝24，再算24－20＝4。','掌握乘减运算顺序',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-005','math','计算 18÷3＋7，结果是多少？',['13','9','10','15'],0,'先算18÷3＝6，再算6＋7＝13。','掌握除加运算顺序',source('math-g3s1-bnu-2026','6','第一单元·混合运算')),
      q('math-u1-006','math','计算 24－12÷3，结果是多少？',['20','4','8','12'],0,'先算12÷3＝4，再算24－4＝20。','掌握除减运算顺序',source('math-g3s1-bnu-2026','6','第一单元·混合运算')),
      q('math-u1-007','math','计算 8＋2×6 时，第一步应该算什么？',['2×6','8＋2','8×6','2＋6'],0,'同一级算式里有乘法和加法时，要先算乘法。','判断混合运算的第一步',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-008','math','计算（15＋9）÷3，结果是多少？',['8','18','12','6'],0,'有括号先算括号：15＋9＝24，再算24÷3＝8。','掌握带括号运算顺序',source('math-g3s1-bnu-2026','10','第一单元·混合运算')),
      q('math-u1-009','math','小明有20元，买3支每支4元的笔，还剩多少元？',['8元','12元','16元','5元'],0,'3支笔一共3×4＝12元，还剩20－12＝8元。','用乘减解决购物问题',source('math-g3s1-bnu-2026','3','第一单元·混合运算')),
      q('math-u1-010','math','4个袋子里各有6个苹果，桌上还有5个。一共有多少个苹果？',['29个','24个','15个','35个'],0,'袋子里有4×6＝24个，再加桌上的5个，共29个。','用乘加解决实际问题',source('math-g3s1-bnu-2026','4','第一单元·混合运算')),

      q('en-u1-001','english','初次见面，对方说“Nice to meet you.”，应该怎样回应？',['Nice to meet you too.','Goodbye.','I am five.','It is a cat.'],0,'“Nice to meet you too.”表示“我也很高兴认识你”。','在情境中使用见面问候',source('en-g3s1-pep-2026','4','Unit 1 Let’s talk')),
      q('en-u1-002','english','别人问“What’s your name?”，哪个回答最合适？',['My name is Chen Jie.','Thank you.','Bye!','It’s an apple.'],0,'询问姓名时，可以用“My name is ...”回答。','介绍自己的姓名',source('en-g3s1-pep-2026','4','Unit 1 Let’s talk')),
      q('en-u1-003','english','“ear”是什么意思？',['耳朵','眼睛','手','嘴'],0,'ear表示“耳朵”。','理解身体部位词汇',source('en-g3s1-pep-2026','5','Unit 1 Let’s learn')),
      q('en-u1-004','english','“hand”是什么意思？',['手','胳膊','耳朵','眼睛'],0,'hand表示“手”。','理解身体部位词汇',source('en-g3s1-pep-2026','5','Unit 1 Let’s learn')),
      q('en-u1-005','english','老师说“Listen!”时，应该做什么？',['认真听','挥手告别','闭上眼睛','离开教室'],0,'listen表示“听、倾听”。','理解课堂指令',source('en-g3s1-pep-2026','5','Unit 1 Let’s learn')),
      q('en-u1-006','english','哪个单词表示“朋友”？',['friend','mouth','apple','dog'],0,'friend表示“朋友”。','理解单元核心词汇',source('en-g3s1-pep-2026','9','Unit 1词汇')),
      q('en-u1-007','english','朋友的彩笔忘带了，你愿意一起用。最合适的话是？',['We can share.','Go away.','I am a dog.','Close the door.'],0,'“We can share.”表示“我们可以分享”。','在友好情境中使用表达',source('en-g3s1-pep-2026','7','Unit 1 Let’s talk')),
      q('en-u1-008','english','别人帮助了你，应该说什么？',['Thank you.','Oh no!','My ear.','Bye-bye.'],0,'得到帮助后说“Thank you.”表示感谢。','使用礼貌表达',source('en-g3s1-pep-2026','7','Unit 1 Let’s talk')),
      q('en-u1-009','english','“Smile!”是在请你做什么？',['微笑','听一听','挥手','指耳朵'],0,'smile表示“微笑”。','理解动作指令',source('en-g3s1-pep-2026','5','Unit 1 Let’s learn')),
      q('en-u1-010','english','准备和朋友分别时，可以说什么？',['Bye!','Nice name.','Listen!','My hand.'],0,'“Bye!”用于告别。','在情境中使用告别表达',source('en-g3s1-pep-2026','5','Unit 1 Let’s learn'))
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
  else root.V1ContentPack = pack;
})(typeof globalThis !== 'undefined' ? globalThis : this);
