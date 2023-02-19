const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png',   //黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png',  //紅心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png',  //方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png'  //梅花
]

const GAME_STATE = {
  FirstCardAwaits : "FirstCardAwaits",
  SecondCardAwaits : "SecondCardAwaits",
  CardMatched : "CardMatched",
  CardMatchFailed : "CardMatchFailed",
  GameFinished : "GameFinished"
}

const view = {
  //-----在displayCards內被執行，搭配map，index帶進打亂後的參數-----
  getCardElement (index){
    //--用dataset功能，在HTML模板取得參數index
    return `
    <div  data-index=${index} class="card back"></div>
    `
  } ,
  //-----取得某張的內容，包括卡片數字與圖案-----
  getCardContent(index){
    const number = this.transformNumber((index % 13) + 1) //卡片數字
    const symbol = Symbols[Math.floor(index / 13)]  //卡片圖案
    return `
      <p>${number}</p>
      <img src=${symbol} alt="">
      <p>${number}</p>
    `
  },
  
  //-----轉換特殊數字的圖案-----
  transformNumber (number){
    switch(number){
      case 1 :
        return 'A'
      case 11 :
        return 'J'
      case 12 :
        return 'Q'
      case 13 :
        return 'K'  
      default:
        return number
    }
  } ,
  
  //-----把打亂的卡片render出來。用map，呼叫getCardElement函式運算-----
  displayCards (indexes) {
    const rootElement = document.querySelector('#cards')
    //-----呼叫洗牌演算法，52張牌亂數呈現並到畫面中---
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  } ,
  
  //點擊不只一張牌，所以用"其餘參數"把多個參數變成一個陣列。再用map迭代
  flipCards(...cards){
    cards.map (card => {
      if(card.classList.contains('back')){
      card.classList.remove('back')
      //-----塞進卡片內容，從flip的card參數，
      //得到從getCardElement設計的dataset------
      card.innerHTML = this.getCardContent(Number(card.dataset.index))    
      return
    } 
    card.classList.add('back')
    card.innerHTML = null
    })
  },
  
  pairCards(...cards){
    cards.map(card =>{
      card.classList.add('pairCard')})
    },
  
  renderScore(score){
    document.querySelector('.scoreNum').textContent = `Score : ${score}`;
  },
  renderTimes(times){
    document.querySelector('.tiredTimes').innerHTML = `Your've tired : ${times}  time`;
  },
  
  appendWrongAnimation(...cards){
    cards.map(card => {
      card.classList.add('wrong')
      //加上.wrong有閃框效果後，再把.wrong拿掉
      card.addEventListener('animationend' , event =>
        event.target.classList.remove('wrong'),{ once: true })
    })
  },
  
  showGameFinished(){
    const div = document.createElement("div")
    div.classList.add("completed")
    const header = document.querySelector("#header")
    div.innerHTML = `
    <p>恭喜完成，太強了，記憶力一級棒!</p>
    <p>得到的分數${Model.scoreNum}分!</br>
     錯誤次數${Model.tiredTimes}次! </p>
    `
    header.before(div)
  },
}


const controller = {
  //預設初始狀態
  currentState : GAME_STATE.FirstCardAwaits ,
  generate () {
    //呼叫displayCards函式，打亂牌的陣列當成引數
    view.displayCards(utility.getRandomNumberArray(52)) 
  },
  
  //藉由點擊卡牌(已被打亂)，改變狀態。所以參數給card
  dispatchCardAction(card){
    // view.flipCard(card
    if(!card.classList.contains('back')){
      return
    }
    switch(this.currentState){
      case GAME_STATE.FirstCardAwaits :
        view.flipCards(card)
        Model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        
        break
      case GAME_STATE.SecondCardAwaits :
        view.flipCards(card)
        Model.revealedCards.push(card)
        view.renderTimes(++Model.tiredTimes)
        //判斷兩張牌是否相同號碼
        if(Model.isRevealedCardsMatched ()){
          //----兩張牌配對成功
          this.currentState = GAME_STATE.CardMatched
          //---把Model.revealedCards這個陣列用展開運算子，把兩張牌都改變底色
          view.pairCards(...Model.revealedCards)
          view.renderScore(Model.scoreNum += 10)
          Model.revealedCards = []
          //=====遊戲結束=======
          if(Model.scoreNum === 260){
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
          
        }else{
          //----兩張牌配對失敗
          this.currentState = GAME_STATE.CardMatchFailed
          view.appendWrongAnimation(...Model.revealedCards)
          console.log(...Model.revealedCards)
          setTimeout(this.resetCards,1000) }
        break
    }
    console.log("this.currentState:",this.currentState)
    // console.log(Model.revealedCards.map(card => card.dataset.index))
  },
  //配對失敗，把牌翻回去，並且把狀態變成"等待翻第一張卡"
  resetCards(){
    //---把Model.revealedCards這個陣列用展開運算子，把兩張牌都翻面
    view.flipCards(...Model.revealedCards)
    Model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
  
}

const Model = {
  //暫存牌組，card丟進revealedCards陣列內
  revealedCards : [] ,
  isRevealedCardsMatched () {
    //判斷兩張牌數字是否相等，會回傳布林值
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  scoreNum : 0 ,
  tiredTimes : 0 ,
}
//------------------洗牌演算法工具------------------
const utility = {
  getRandomNumberArray(count) {
    const cardArray = Array.from(Array(count).keys())
    for(let index = cardArray.length-1 ; index > 0 ; index-- ){
      let randomIndex = Math.floor( Math.random() * (index + 1));
      [cardArray[index] , cardArray[randomIndex]] = [cardArray[randomIndex] , cardArray[index]]
    }
    return cardArray
  },
}

//----------由controller呼叫generate，就會把打亂的牌render出來
controller.generate()

//------------------翻牌的監聽器------------------
//把被打亂、render出來的牌，變成DOM物件card
//再用forEach，監聽每張被點到的card，做事件
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    // console.log(card)
    
    controller.dispatchCardAction(card)
  })
})