(function(root){
  'use strict';
  const factory=typeof module!=='undefined'&&module.exports?require('./pack-factory.js'):root.PackFactory;
  const groups=[
    {id:'unit-3',label:'Unit 3',title:'Our animal friends',order:26,rows:[
      ['“dog”是什么意思？',['狗','猫','鱼','鸟'],'dog表示狗。',29],
      ['“cat”是什么意思？',['猫','狗','兔子','狮子'],'cat表示猫。',29],
      ['“bird”是什么意思？',['鸟','鱼','老虎','大象'],'bird表示鸟。',29],
      ['“rabbit”是什么意思？',['兔子','狐狸','猴子','熊猫'],'rabbit表示兔子。',29],
      ['“fish”在动物话题中是什么意思？',['鱼','鸟','狗','兔子'],'fish在这里表示鱼。',29],
      ['“fox”是什么意思？',['狐狸','狮子','大象','熊猫'],'fox表示狐狸。',31],
      ['“panda”是什么意思？',['大熊猫','老虎','兔子','长颈鹿'],'panda表示大熊猫；red panda表示小熊猫。',32],
      ['“monkey”是什么意思？',['猴子','狮子','大象','鸟'],'monkey表示猴子。',32],
      ['“tiger”是什么意思？',['老虎','小猫','狐狸','兔子'],'tiger表示老虎。',32],
      ['“lion”是什么意思？',['狮子','老虎','鱼','狗'],'lion表示狮子。',32],
      ['“elephant”是什么意思？',['大象','兔子','猴子','猫'],'elephant表示大象。',32],
      ['朋友问“Do you have a pet?”，你确实养了一只猫，哪句回答合适？',['Yes, I do. I have a cat.',"No, I don't.",'It is red.','I am seven.'],'先肯定回答，再说明自己有一只猫。',28],
      ['朋友问“Do you have a pet?”，你没有养宠物，怎样回答？',["No, I don't.",'Yes, I do.','It is blue.','I am a pet.'],'没有宠物时用“No, I don’t.”回答。',28],
      ['指着一只大象问“What’s this?”，应该怎样回答？',["It's an elephant.","It's a cat.","It's a fish.","It's a rabbit."],'问这是什么，可用“It’s ...”说明动物名称。',32],
      ['“The giraffe is tall.”中的“tall”是什么意思？',['高的','快的','小的','红色的'],'这句话描述长颈鹿很高。',33]
    ]},
    {id:'unit-4',label:'Unit 4',title:'Plants around us',order:38,rows:[
      ['“apple”是什么意思？',['苹果','香蕉','葡萄','橙子'],'apple表示苹果。',41],
      ['“banana”是什么意思？',['香蕉','苹果','橙子','葡萄'],'banana表示香蕉。',41],
      ['在水果话题中，“orange”是什么意思？',['橙子','苹果','葡萄','香蕉'],'orange在这里指橙子；在颜色话题中意思不同。',41],
      ['“grapes”是什么意思？',['葡萄','苹果','橙子','香蕉'],'grapes表示葡萄。',41],
      ['“flower”是什么意思？',['花','草','树','水'],'flower表示花。',44],
      ['“grass”是什么意思？',['草','花','天空','苹果'],'grass表示草。',44],
      ['“tree”是什么意思？',['树','水','风','太阳'],'tree表示树。',44],
      ['“water”作名词时表示什么？',['水','空气','阳光','树叶'],'water作名词表示水，作动词还可以表示浇水。',44],
      ['“air”是什么意思？',['空气','水','花','葡萄'],'air表示空气。',44],
      ['“sun”在植物生长的话题中指什么？',['太阳、阳光','月亮','土壤','果实'],'课文用sun表示太阳或阳光。',44],
      ['别人问“Do you like apples?”，你喜欢苹果，怎样回答？',['Yes, I do.',"No, I don't.",'I am ten.','It is a bird.'],'喜欢时用“Yes, I do.”肯定回答。',40],
      ['你不喜欢苹果，但喜欢香蕉，哪句话表达准确？',["No, I don't. I like bananas.",'Yes, I do. I like apples.','I have a cat.','My name is Mike.'],'先否定喜欢苹果，再说明喜欢香蕉。',41],
      ['“We can plant trees.”是什么意思？',['我们可以种树','我们可以砍掉所有树','我们可以数星星','我们可以喂猫'],'plant在这里作动词，表示种植。',43],
      ['根据课文“Plants need air, water and sun.”，植物需要什么？',['空气、水和阳光','玩具、书包和鞋子','糖果、帽子和铅笔','只需要一面镜子'],'这句话列出了air、water和sun三项。',44],
      ['“We can water the flowers.”中的“water”表示什么动作？',['给花浇水','给花拍照','给花数数','给花唱歌'],'water在这句话中作动词，表示浇水。',43]
    ]},
    {id:'unit-5',label:'Unit 5',title:'The colourful world',order:50,rows:[
      ['“red”表示哪种颜色？',['红色','蓝色','绿色','白色'],'red表示红色。',56],
      ['“blue”表示哪种颜色？',['蓝色','红色','黄色','黑色'],'blue表示蓝色。',53],
      ['“green”表示哪种颜色？',['绿色','紫色','白色','粉色'],'green表示绿色。',53],
      ['“yellow”表示哪种颜色？',['黄色','蓝色','棕色','黑色'],'yellow表示黄色。',53],
      ['“purple”表示哪种颜色？',['紫色','红色','绿色','白色'],'purple表示紫色。',53],
      ['“brown”表示哪种颜色？',['棕色','粉色','蓝色','黄色'],'brown表示棕色。',53],
      ['“pink”表示哪种颜色？',['粉色','黑色','绿色','棕色'],'pink表示粉色。',56],
      ['“white”表示哪种颜色？',['白色','红色','紫色','黄色'],'white表示白色。',56],
      ['“black”表示哪种颜色？',['黑色','白色','粉色','蓝色'],'black表示黑色。',56],
      ['在“What colour is it?”的回答中，“orange”表示什么？',['橙红色','一种动物','数字八','星期日'],'颜色话题中的orange表示橙红色或橙色。',52],
      ['想问一个物品是什么颜色，哪句话合适？',['What colour is it?','How old are you?',"What's your name?",'Do you have a pet?'],'“What colour is it?”用于询问颜色。',52],
      ['想表达“我喜欢红色和粉色”，应选哪句？',['I like red and pink.','I like blue and green.','I have two cats.','I am five years old.'],'red是红色，pink是粉色。',55],
      ['根据Unit 5的颜料混色示例，red和blue混合得到什么颜色？',['purple','white','black','yellow'],'课文的示例是Red and blue make purple。',52],
      ['根据Unit 5的颜料混色示例，blue和yellow混合得到什么颜色？',['green','pink','brown','white'],'课文的示例是Blue and yellow make green。',52],
      ['“Be careful!”是什么意思？',['小心！','生日快乐！','早上好！','我叫迈克。'],'Be careful用于提醒小心。',57]
    ]},
    {id:'unit-6',label:'Unit 6',title:'Useful numbers',order:62,rows:[
      ['数字1对应哪个英语单词？',['one','two','three','four'],'one表示一。',65],
      ['数字2对应哪个英语单词？',['two','one','three','five'],'two表示二。',65],
      ['数字3对应哪个英语单词？',['three','two','four','five'],'three表示三。',65],
      ['数字4对应哪个英语单词？',['four','five','three','one'],'four表示四。',65],
      ['数字5对应哪个英语单词？',['five','four','two','one'],'five表示五。',65],
      ['数字6对应哪个英语单词？',['six','seven','eight','nine'],'six表示六。',68],
      ['数字7对应哪个英语单词？',['seven','six','eight','ten'],'seven表示七。',68],
      ['数字8对应哪个英语单词？',['eight','nine','seven','six'],'eight表示八。',68],
      ['数字9对应哪个英语单词？',['nine','eight','ten','seven'],'nine表示九。',68],
      ['数字10对应哪个英语单词？',['ten','nine','eight','six'],'ten表示十。',68],
      ['想询问对方几岁了，应该怎样说？',['How old are you?','What colour is it?',"What's this?",'Do you like apples?'],'How old are you用于询问年龄。',64],
      ['你今年八岁，怎样回答“How old are you?”？',["I'm eight years old.","I'm five years old.",'I have eight apples.','It is eight yuan.'],'年龄用“I’m ... years old.”表达，eight表示八。',64],
      ['“How many apples?”在询问什么？',['苹果的数量','苹果的颜色','一个人的姓名','一个人的年龄'],'How many用于询问数量。',67],
      ['售货员说“That’s ten yuan, please.”，表示要付多少钱？',['十元','六元','七元','九元'],'ten yuan表示十元。',68],
      ['“It’s seven o’clock.”表示什么时间？',['七点整','六点整','八点整','九点整'],'seven是七，o’clock表示整点。',69]
    ]},
    {id:'revision',label:'Revision',title:'Being a good guest',order:74,kind:'review',rows:[
      ['到朋友家见面时，哪句问候最合适？',['Hello!','Go away!','Be quiet forever!','I do not know you!'],'做客见面时可以用Hello或Hi打招呼。',76],
      ['收到主人送来的水果后，最合适的话是什么？',['Thank you.','Go away.','My foot.','No name.'],'受到招待或帮助时应表达感谢。',77],
      ['结束做客准备离开时，可以说什么？',['Goodbye!','Good morning!','How many?',"What's this?"],'Goodbye用于告别。',77],
      ['到朋友家门外，哪种做法符合“good guest”的要求？',['先敲门，再问好','不打招呼就乱翻东西','大声吵闹','随意拿走玩具'],'课文做客清单写到Knock和Say Hello。',77],
      ['“Care and share.”强调什么？',['关心别人并分享','只顾自己并抢东西','永远不听别人说话','把别人的东西藏起来'],'care是关心，share是分享。',77],
      ['“We can help.”是什么意思？',['我们可以帮忙','我们只能睡觉','我们不认识你','这是我的名字'],'这句话表达愿意帮助别人。',75],
      ['主人问“Do you like bananas?”，你喜欢香蕉，怎样回应礼貌又准确？',['Yes, I do. Thanks.',"No, I don't. Thanks.",'It is a lion.','I am six.'],'肯定喜欢香蕉，并说Thanks表示感谢。',75],
      ['在家庭介绍中，“This is my mother.”是什么意思？',['这是我的妈妈','这是我的爸爸','这是我的哥哥','这是我的爷爷'],'mother表示妈妈，This is用于介绍。',74],
      ['身体部位词“mouth”是什么意思？',['嘴','耳朵','手','胳膊'],'mouth表示嘴。',74],
      ['身体部位词“eye”是什么意思？',['眼睛','手','嘴','胳膊'],'eye表示眼睛。',74],
      ['朋友指着狮子问“Is that a tiger?”，怎样回答？',["No, it's a lion.",'Yes, it is.','It is a fish.','It is a banana.'],'先否定老虎，再说明是狮子。',76],
      ['“black, orange and white”是哪三种颜色？',['黑色、橙红色和白色','蓝色、绿色和黄色','粉色、红色和紫色','棕色、绿色和蓝色'],'依次对应black、orange、white。',75],
      ['“three apples”表示什么？',['三个苹果','两个橙子','三根香蕉','四个苹果'],'three是三，apples是苹果。',75],
      ['“Water the flowers.”表示什么？',['给花浇水','种下大树','数一数猫','涂成红色'],'water作动词表示浇水，flowers表示花。',75],
      ['英语字母表中，F的小写字母是哪一个？',['f','t','e','g'],'F对应小写f，注意与t区分。',77]
    ]}
  ];
  const pack=factory.create({subject:'english',offset:5,book:{id:'en-g3s1-pep-2026',subject:'english',title:'英语三年级上册（PEP）',publisher:'人民教育出版社',sourceFile:'人教PEP版·英语三年级上册.pdf'},groups});
  if(typeof module!=='undefined'&&module.exports)module.exports=pack;else root.EnglishRestPack=pack;
})(typeof globalThis!=='undefined'?globalThis:this);
