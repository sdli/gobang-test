/*
这是一个简化的event管理类
提供了事件监听（on）、事件触发（emit）和事件删除（delete）三个接口
用于对外提供各类事件接口
*/
class Events {
  constructor() {
    this.events = {};
  }

  on(e, fn) {
    if (typeof this.events[e] === 'undefined') {
      this.events[e] = [fn];
    } else {
      this.events[e].push(fn);
    }
  }

  emit(e, ...rest) {
    if (typeof this.events[e] !== 'undefined') {
      for (const fn of this.events[e]) {
        fn(rest);
      }
    }
  }

  delete(e, ifAll = false) {
    if (typeof this.events[e] !== 'undefined') {
      ifAll ? this.events[e].splice(0, 1) : delete this.events[e];
    }
  }
}


/*
Gobang是一个黑白棋的类
包括黑白棋位置、黑白棋步骤的记录、黑白棋前进和后退的方法
*/
class Gobang extends Events {
  constructor() {
    super();

    // 实例属性
    this.checkedBlack = new Set(); // 黑棋Set
    this.checkedWhite = new Set(); // 白棋Set
    this.steps = []; // 步骤记录
    this.currentStep = 0; // 当前步数
    this.wined = false; // 是否锁定棋盘

    // 事件管理
    this.eventGroup = {
      ready: 'ready',
      pre: 'pre',
      go: 'go',
      next: 'next',
      error: 'error',
    };

    // 报错管理
    this.errorList = {
      1: '数据格式不正确',
    };
  }

  // 设置初始化数据
  setData(data) {
    for (const i in data) {
      if (i in this) {
        this[i] === data[i];
      }
    }
    return this;
  }

  // 返回一步
  pre() {
    // 获取最后一步棋
    if (this.currentStep - 2 >= 0 && !this.wined) {
      const lastStep = this.steps[this.currentStep - 1]; const
        preStep = this.steps[this.currentStep - 2];
      console.log('回退了一步', lastStep);

      // 回退数据
      lastStep.type === 0 ? this.checkedBlack.delete(lastStep.id) : this.checkedWhite.delete(lastStep.id);
      this.emit(this.eventGroup.pre, lastStep);

      preStep.type === 0 ? this.checkedBlack.delete(preStep.id) : this.checkedWhite.delete(preStep.id);
      this.emit(this.eventGroup.pre, preStep);

      this.currentStep = this.currentStep - 2;
    }

    return this;
  }

  // 下棋
  go(id, robot = false) {
    if ((!robot || ((this.currentStep) % 2 === 1 && robot)) && !this.wined) {
      if (typeof id === 'number' || (id.prototype.isPrototypeOf([]) && id.length === 2)) {
        if (robot) { console.log('机器人下棋开始'); }

        const newId = id.length === 2 ? (id[0] - 1) * 15 + id[1] : id;
        if (!this.checkedBlack.has(newId) && !this.checkedWhite.has(newId)) {
          const step = { type: (this.currentStep) % 2, id };
          if (this.currentStep < this.steps.length - 1) {
            this.steps.splice(this.currentStep, this.steps.length - this.currentStep);
          }

          // 记录步骤和更新黑白棋set
          (this.currentStep) % 2 === 0 ? this.checkedBlack.add(newId) : this.checkedWhite.add(newId);
          this.steps.push(step);

          this.currentStep++;
          console.log('走了一步', step);
          this.emit(this.eventGroup.go, step, {
            checkedBlack: this.checkedBlack,
            checkedWhite: this.checkedWhite,
            robot,
          });
        }
      }
    }
    return this;
  }

  // 撤销返回
  next() {
    if (this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];


      const stepNext = this.steps[this.currentStep + 1];

      // 前进两步骤
      step.type === 1 ? this.checkedWhite.add(step.id) : this.checkedBlack.add(step.id);
      this.emit(this.eventGroup.next, step);

      stepNext.type === 0 ? this.checkedBlack.add(stepNext.id) : this.checkedWhite.add(stepNext.id);
      this.emit(this.eventGroup.next, stepNext);

      console.log('撤销了一次');
      this.currentStep = this.currentStep + 2;
    }

    return this;
  }

  clear(){
    if (this.currentStep  > 0) {
      
      for(let i of this.steps){
        i.type === 0 ? this.checkedBlack.delete(i.id) : this.checkedWhite.delete(i.id);
        this.emit(this.eventGroup.pre, i);
      }

      console.log("棋盘被清空")

      // 重置数据
      this.currentStep = 0;
      this.checkedBlack = new Set(); // 黑棋Set
      this.checkedWhite = new Set(); // 白棋Set
      this.steps = []; // 步骤记录
      this.wined = false; // 是否锁定棋盘
    }
  }

  win() {
    this.wined = true;
  }
}

/*
使用原生js创建dom
此类提供了初始化dom，绑定监听方法和回调方法
*/
class ChessDom extends Gobang {
  constructor(id) {
    super();

    // 初始化dom节点
    this.id = id;
    this.dom = document.getElementById(id);

    // 立即初始化dom结构
    this.domInit();

    // 处理pre和next事件，即回退事件
    this.on('pre', step => this.domClear(false, step));
    this.on('next', step => this.domShow(step));

    // 处理go事件，即下棋事件
    this.on('go', step => this.domShow(step));
  }


  // dom初始化方法
  domInit() {
    const chessDom = this.dom;


    const divDom = document.createElement('div');
    // 添加棋盘内部标签
    divDom.innerHTML = '<span></span><span></span><span></span><span></span>';

    // 生成棋盘
    for (let i = 1; i < 226; i++) {
      const tempDom = divDom.cloneNode(true); let
        className = '';
      if (i === 1) {
        className = 'chess_top_left';
      } else if (i > 1 && i < 15) {
        className = 'chess_top';
      } else if (i === 15) {
        className = 'chess_top_right';
      } else if (i > 15 && i < 211) {
        if (i % 15 === 1) {
          className = 'chess_left';
        } else if (i % 15 == 0) {
          className = 'chess_right';
        } else {
          className = 'chess_center';
        }
      } else if (i === 211) {
        className = 'chess_bottom_left';
      } else if (i > 211) {
        className = i !== 225 ? 'chess_bottom' : 'chess_bottom_right';
      }

      tempDom.setAttribute('class', className);
      tempDom.setAttribute('data-location', i);
      chess.appendChild(tempDom);
    }

    // 初始化后，对事件进行绑定
    this.bindhandler();
    this.emit(this.eventGroup.ready);
  }

  // 清除dom上的棋子，可以设置清空全部
  domClear(all = false, step) {
    if (!all) {
      this.domController(false, step);
    } else {
      const fullDom = document.getElementsByTagName('div'); const
        stepData = step[0];
      for (let j = 0; j < fullDom.length; i++) {
        if (fullDom[i].attributes.length != 0 && typeof fullDom[i].attributes !== 'undefined' && typeof fullDom[i].attributes[1].value !== 'undefined') {
          fullDom[i].removeAttribute('black');
          fullDom[i].removeAttribute('white');
        }
      }
    }
  }

  // 用于显示某个棋子放置
  domShow(step) {
    this.domController(true, step);
  }

  // dom 控制器
  domController(add = false, step) {
    const fullDom = document.getElementsByTagName('div'); const
      stepData = step[0];
    for (let i = 0; i < fullDom.length; i++) {
      if (fullDom[i].attributes.length != 0 && typeof fullDom[i].attributes[1] !== 'undefined' && parseInt(fullDom[i].attributes[1].value) == stepData.id) {
        !add ? fullDom[i].removeAttribute(stepData.type !== 1 ? 'black' : 'white') : fullDom[i].setAttribute(stepData.type !== 1 ? 'black' : 'white', 'true');
      }
    }
  }

  // 绑定监听方法
  bindhandler() {
    this.dom.addEventListener('click', (e) => {
      let target = e.target;
      while (target) {
        if (target.attributes.length > 0 && typeof target.attributes[1] !== 'undefined') {
          if (target.attributes[1].nodeName === 'class' && target.attributes[1].value == 'chess') {
            break;
          }

          if (target.tagName.toLowerCase() === 'div') {
            this.go(parseInt(target.attributes[1].value));
            break;
          }
        }

        target = target.parentNode;
      }
    });
  }
}


/*
一个简单用于计算赢法的类
提供了赢法数组的初始化、赢法的热点图、以及用于计算的各种方法
*/
class SillyRobot {
  constructor() {
    this.blackHotMap = new Map();
    this.whiteHotMap = new Map();
    this.checkedBlack = new Set();
    this.checkedWhite = new Set();
    this.__winArr = [];
    this.__winIds = [];
    this.winner = [];

    // 数据初始化
    this.dataInit();
  }

  // 初始化赢法数组
  dataInit() {
    this.getWinArr();
  }

  // 用于更新数据
  idea({ checkedBlack, checkedWhite }) {
    this.checkedBlack = checkedBlack;
    this.checkedWhite = checkedWhite;

    const tempArrBlack = this.arrayToId(checkedWhite); const
      tempArrWhite = this.arrayToId(checkedBlack);
    if (tempArrBlack === 1 || tempArrWhite === 1) {
      return {
        winner: tempArrBlack !== 1 ? '您' : '电脑',
      };
    }
    this.blackHotMap = this.idToHotMap(tempArrBlack, checkedBlack);
    this.whiteHotMap = this.idToHotMap(tempArrWhite, checkedWhite);
    return this.getBestIdea();
  }

  // 提供赢法数组
  getWinArr() {
    const winArrs = [];
    for (let i = 1; i <= 15; i++) {
      for (let j = 1; j <= 15; j++) {
        // 横向
        if (i + 4 < 16) {
          winArrs.push([[i, j], [i + 1, j], [i + 2, j], [i + 3, j], [i + 4, j]]);
        }

        // 纵向
        if (j + 4 < 16) {
          winArrs.push([[i, j], [i, j + 1], [i, j + 2], [i, j + 3], [i, j + 4]]);
        }

        // 二四象限
        if (i + 4 < 16 && j + 4 < 16) {
          winArrs.push([[i, j], [i + 1, j + 1], [i + 2, j + 2], [i + 3, j + 3], [i + 4, j + 4]]);
        }

        // 一三象限
        if (i > 4 && j < 12) {
          winArrs.push([[i, j], [i - 1, j + 1], [i - 2, j + 2], [i - 3, j + 3], [i - 4, j + 4]]);
        }
      }
    }

    this.__winArr = winArrs;
  }

  // 将赢法数组的坐标转化为id
  arrayToId(set) {
    const totalIds = [];
    for (const arr of this.__winArr) {
      const tempArr = []; let count = 0;
      for (let i = 0; i < 5; i++) {
        const id = (arr[i][0] - 1) * 15 + arr[i][1];
        if (set.has(id)) {
          count++;
        }
        tempArr.push(id);
      }

      if (count === 5) {
        return 1;
      } if (count == 0) {
        totalIds.push(tempArr);
      }
      count = 0;
    }
    return totalIds;
  }

  // 热点图，用于分析最佳下棋的位置
  idToHotMap(ids, checked) {
    const newMap = new Map();
    ids.forEach((val) => {
      let count = 0; let score = 0;
      val.forEach((v) => {
        if (checked.has(v)) {
          count++;
        }
      });
      switch (count) {
        case 0:
          score = 0; break;
        case 1:
          score = 10; break;
        case 2:
          score = 50; break;
        case 3:
          score = 1000; break;
        case 4:
          score = 9999; break;
        default:
          score = 0;
      }
      val.forEach((value) => {
        const data = (newMap.has(value) && typeof newMap.get(value) !== 'undefined') ? (parseInt(newMap.get(value)) + score) : score;
        newMap.set(value, parseInt(data));
      });
      count = 0;
      score = 0;
    });

    return newMap;
  }

  // 获取最佳方法
  getBestIdea() {
    let MaxBlack = 0; let MaxBlackId = 0;


    let MaxWhite = 0; let
      MaxWhiteId = 0;

    this.blackHotMap.forEach((val, key) => {
      let temp = 0; let
        tempVal = 0;
      if (this.whiteHotMap.has(key)) {
        temp = typeof this.whiteHotMap.get(key) === 'undefined' ? 0 : this.whiteHotMap.get(key);
        tempVal = typeof val === 'undefined' ? 0 : val;
        this.whiteHotMap.set(key, tempVal + temp);
      }
    });

    this.whiteHotMap.forEach((val, key) => {
      let temp = 0; let tempVal = 0;
      if (this.blackHotMap.has(key)) {
        temp = typeof this.blackHotMap.get(key) === 'undefined' ? 0 : this.blackHotMap.get(key);
        tempVal = typeof val === 'undefined' ? 0 : val;
        this.blackHotMap.set(key, tempVal + temp);
      }
    });

    this.blackHotMap.forEach((val, key) => {
      const t = (val > MaxBlack && !this.checkedBlack.has(key) && !this.checkedWhite.has(key)) ? 1 : 0;
      MaxBlack = t === 1 ? val : MaxBlack;
      MaxBlackId = t === 1 ? key : MaxBlackId;
    });
    this.whiteHotMap.forEach((val, key) => {
      const t = (val > MaxWhite && !this.checkedBlack.has(key) && !this.checkedWhite.has(key)) ? 1 : 0;
      MaxWhite = t === 1 ? val : MaxWhite;
      MaxWhiteId = t === 1 ? key : MaxWhiteId;
    });

    return {
      black: { MaxBlack, MaxBlackId },
      white: { MaxWhite, MaxWhiteId },
    };
  }
}
