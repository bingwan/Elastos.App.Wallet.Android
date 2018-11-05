import { Component,ViewChild } from '@angular/core';
import { NavController, NavParams, Events,Platform,App,Tabs} from 'ionic-angular';
import {LauncherComponent} from "../../pages/launcher/launcher.component";
import {WalletManager} from "../../providers/WalletManager";
import {Native} from "../../providers/Native";
import {Util} from "../../providers/Util";
import {Config} from "../../providers/Config";
import { TabsComponent } from '../../pages/tabs/tabs.component';
import { LocalStorage } from "../../providers/Localstorage";
import { PaymentConfirmComponent } from "../../pages/coin/payment-confirm/payment-confirm.component";
import { DidLoginComponent } from "../../pages/third-party/did-login/did-login.component";
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'page-initializepage',
  templateUrl: 'initializepage.html',
})
export class InitializepagePage {
  @ViewChild('myTabs') tabs:Tabs;
  backButtonPressed: boolean = false;  //用于判断返回键是否触发
  constructor(public appCtrl: App,private platform: Platform,public navCtrl: NavController, public navParams: NavParams,public walletManager: WalletManager,public native: Native,public localStorage: LocalStorage,public events: Events,private translate: TranslateService) {

  }

  ionViewDidLoad() {
    this.registerBackButtonAction(this.tabs);
    this.native.showLoading().then(()=>{
      this.initializeApp();
    });

  }

  registerBackButtonAction(tabRef:Tabs){
    this.platform.registerBackButtonAction(() => {
      let activeNav: NavController = this.appCtrl.getActiveNav();
      if(activeNav.canGoBack()){
        activeNav.pop();
      }else{
        if (tabRef == null || tabRef._selectHistory[tabRef._selectHistory.length - 1] === tabRef.getByIndex(0).id) {
          this.showExit();
        }else{
           //选择首页第一个的标签
           tabRef.select(0);
        }
      }

    },1);
  }

    //双击退出提示框
    showExit() {
      if (this.backButtonPressed) { //当触发标志为true时，即2秒内双击返回按键则退出APP
	  this.platform.exitApp();
      } else {
        let exitmesage = this.translate.instant("text-exit-message");
        this.native.toast(exitmesage);
        this.backButtonPressed = true;
        setTimeout(() => this.backButtonPressed = false, 2000);//2秒内没有再次点击返回则将触发标志标记为false
      }
    }


  initializeApp(){
     this.load().then((data)=>{

       this.successHandle(data["success"]);


     }).catch((data)=>{
      this.errorHandle(data);

     });
  }

  public load(): Promise<any>{
     return  new Promise((resolve, reject) =>{
          this.walletManager.getAllMasterWallets((data)=>{
                 if(data["success"]){
                    resolve(data);
                 }else{
                  reject(data);
                 }
          });
     });
  }

  successHandle(data){
      let idList = JSON.parse(data);
      let type = Util.GetQueryString("type");
      let self =this;
      if(idList.length === 0){
         Config.setMappingList({});
         this.handleNull(type);
       }else{
         this.localStorage.getCurMasterId().then((data) => {
          let item = JSON.parse(data);
          Config.setCurMasterWalletId(item["masterId"]);
          Config.setMasterWalletIdList(idList);

          this.handleMappingdata(idList);
          this.getAllsubWallet(item["masterId"],type);


           console.log("ElastJs successHandle before getkyc ");
           self.localStorage.getKyc().then((val)=>{
             console.log("ElastJs successHandle  getkyc val " + val);
             if(val == null || val === undefined || val === {} || val === ''){
               return;
             }
             let masterWalletId = Config.getCurMasterWalletId();
             console.log("ElastJs successHandle  getkyc masterWalletId " + masterWalletId);
             let kycObj = JSON.parse(val);
             let serids = Config.getSertoIdNew(kycObj[masterWalletId]);
             Config.setSerIds(serids);
             console.log("ElastJs successHandle setSerIds "+ JSON.stringify(serids));

           });
        });

       }
  }

  public errorHandle(data){
       let error = data["error"];
       console.log("====error ====="+JSON.stringify(error));

       if(error["code"] === 10002){
        console.log("====code ====="+error["code"]);
        let type = Util.GetQueryString("type");
         this.handleNull(type);
       }else{
         this.native.hideLoading();
       }
  }

  handleNull(type){
    if (type == 'payment') {
      let account = Util.GetQueryString("account");
      let toAddress = Util.GetQueryString("address");
      let memo = Util.GetQueryString("memo");
      let payment_params = {
        account: account,
        toAddress: toAddress,
        memo: memo
      }
      this.localStorage.set('payment', payment_params).then(()=>{
         this.native.hideLoading();
          Config.setMasterWalletIdList([]);
          this.native.setRootRouter(LauncherComponent);
      });
    }else{
      this.native.hideLoading();
      Config.setMasterWalletIdList([]);
      this.native.setRootRouter(LauncherComponent);
    }
  }

  handleMappingdata(idList){
    let mappList = Config.getMappingList();
    let list = {};
    for(let index in idList){
        let id = idList[index];
        list[id] = mappList[id];
    }
    Config.setMappingList(list);
    console.log("===setMappingList===="+JSON.stringify(Config.getMappingList()));
  }

  getAllsubWallet(masterId,type){
      this.walletManager.getAllSubWallets(masterId,(data)=>{
        if(data["success"]){

          let chinas = JSON.parse(data["success"]);
          for (let index in chinas) {
            let chain =  chinas[index];
            this.registerWalletListener(masterId,chain);
          }

          this.native.hideLoading();
          switch (type) {
            case "payment":
              this.native.setRootRouter(PaymentConfirmComponent);
              break;
            case "did_login":
              this.native.setRootRouter(DidLoginComponent);
              break;
            default:
              this.native.setRootRouter(TabsComponent);
              break;
          }
        }
      });
  }

  registerWalletListener(masterId,coin){

    this.walletManager.registerWalletListener(masterId,coin,(data)=>{
            //console.log("==========="+Config.isResregister(masterId,coin))
            if(!Config.isResregister(masterId,coin)){
              //console.log("==========="+Config.isResregister(masterId,coin))
              Config.setResregister(masterId,coin,true);
            }
            this.events.publish("register:update",masterId,coin,data);
    });
  }

}
