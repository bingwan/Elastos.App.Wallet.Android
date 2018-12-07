import {Component,NgZone} from '@angular/core';
import {CoinComponent} from "../../coin/coin.component";
import {CoinListComponent} from "../../coin/coin-list/coin-list.component";
import { Config } from '../../../providers/Config';
import { PaymentConfirmComponent } from '../../coin/payment-confirm/payment-confirm.component';
import {WalltelistPage} from '../../../pages/walltelist/walltelist';
import {Util} from '../../../providers/Util';
import { NavController, NavParams,Events} from 'ionic-angular';
import {WalletManager} from '../../../providers/WalletManager';
import {Native} from "../../../providers/Native";
import {LocalStorage} from "../../../providers/Localstorage";
import {PopupProvider} from "../../../providers/popup";
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  masterWalletId:string ="1";
  elaPer:any;
  idChainPer:any;
  wallet = {
    name: 'myWallet',
    showBalance: true
  };
  ElaObj ={"name":"ELA","balance":0};
  coinList = [];
  account:any={};
  constructor(public navCtrl: NavController, public navParams: NavParams,public walletManager: WalletManager,public native:Native,public localStorage:LocalStorage,public zone:NgZone,public events:Events,public popupProvider: PopupProvider){
     //this.init();
  }

  ionViewWillEnter(){
     this.init();
  }

  ionViewDidLeave(){
    this.events.unsubscribe("register:update");
    this.events.unsubscribe("walletname:update");
    this.events.unsubscribe("wallte:update");
  }

  init() {
    this.masterWalletId =  Config.getCurMasterWalletId();
    this.account = Config.getAccountType(this.masterWalletId);
    this.wallet["name"] = Config.getWalletName(this.masterWalletId);
    this.events.subscribe("register:update",(walletId,coin,result)=>{

                if(result["MasterWalletID"] ===  this.masterWalletId && result["ChaiID"] === "ELA"){
                    this.handleEla(result);
                }

               if(result["MasterWalletID"] === this.masterWalletId && result["ChaiID"] === "IdChain"){
                  this.handleIdchain(coin,result);
                }
    });
    this.goPayment();
    this.zone.run(()=>{
      this.elaPer = Config.getMasterPer(this.masterWalletId,"ELA");;
      this.idChainPer = Config.getMasterPer(this.masterWalletId,"IdChain");
    });
    this.getAllSubWallets();
    this.events.subscribe("walletname:update",()=>{
      this.wallet["name"] = Config.getWalletName(this.masterWalletId);
    });
    this.events.subscribe("wallte:update",(item)=>{
      this.masterWalletId = item;
      Config.setCurMasterWalletId(this.masterWalletId);

      this.zone.run(()=>{
        this.wallet["name"] = Config.getWalletName(this.masterWalletId);
        this.elaPer = Config.getMasterPer(this.masterWalletId,"ELA");
        this.idChainPer =Config.getMasterPer(this.masterWalletId,"IdChain");
      });
      this.getAllSubWallets();
    });
   }

  onOpen() {
    this.wallet.showBalance = !this.wallet.showBalance;
  }

  goPayment() {
    this.localStorage.get('payment').then((val)=>{
      if (val) {
        this.localStorage.remove('payment');
        this.native.Go(this.navCtrl,PaymentConfirmComponent, JSON.parse(val));
      }
    });
  }

  onClick(type){
    switch (type){
      case 0:
        this.native.Go(this.navCtrl,WalltelistPage);
        break;
      case 1:
      this.native.Go(this.navCtrl,CoinListComponent);
        break;
    }
  }

  onItem(item) {
    this.native.Go(this.navCtrl,CoinComponent, {name: item.name,"elaPer":this.elaPer,"idChainPer":this.idChainPer});
  }

  getElaBalance(item){
    this.walletManager.getBalance(this.masterWalletId,item.name,(data)=>{
      if(!Util.isNull(data["success"])){
        this.zone.run(()=>{
          this.ElaObj.balance = data["success"]/Config.SELA;
        });
      }else{
        alert("getElaBalance=error:"+JSON.stringify(data));
      }
    });
  }

  getAllSubWallets(){
        this.getElaBalance(this.ElaObj);
        this.handleSubwallet();
  }

  getSubBalance(coin){
    this.walletManager.getBalance(this.masterWalletId,coin, (data)=>{
      this.native.info(data);
      if(!Util.isNull(data["success"])){
         if(this.coinList.length === 0){
          this.coinList.push({name: coin, balance: data["success"]/Config.SELA});
         }else{
            let index = this.getCoinIndex(coin);
            if(index!=-1){
               let item = this.coinList[index];
                   item["balance"] =  data["success"]/Config.SELA;
                   this.coinList.splice(index,1,item);

            }else{
                   this.coinList.push({name: coin, balance: data["success"]/Config.SELA});
            }
         }
      }else{
               alert("getSubBalance=error"+JSON.stringify(data));
      }
    });
  }

  getCoinIndex(coin){
   for(let index = 0; index <this.coinList.length;index++){
             let item = this.coinList[index];
              if(coin === item["name"]){
                    return index;
              }
   }
   return -1;
  }





  handleSubwallet(){
      let subwall  = Config.getSubWallet(this.masterWalletId);

      if(subwall){
        if(Util.isEmptyObject(subwall)){
          this.coinList = [];
          return;
        }
      for(let coin in subwall) {
          //this.sycIdChain(coin);
          this.getSubBalance(coin);
       }

      }else{
         this.coinList = [];
      }
  }

  handleEla(result){
    if(result["Action"] === "OnTransactionStatusChanged"){
      this.native.info(result['confirms']);
      if (result['confirms'] == 1) {
        this.getElaBalance(this.ElaObj);
        this.popupProvider.ionicAlert('confirmTitle', 'confirmTransaction').then((data) => {
        });
       }
    }

    if(result["Action"] === "OnBalanceChanged"){
      if(!Util.isNull(result["Balance"])){
        this.zone.run(() => {
          this.ElaObj.balance = result["Balance"]/Config.SELA;
        });
       }
     }
     if(result["Action"] === "OnBlockSyncStopped"){
            this.zone.run(() => {
              this.elaPer = Config.getMasterPer(this.masterWalletId,"ELA");
            });
         }else if(result["Action"] === "OnBlockSyncStarted"){
          this.zone.run(() => {
            this.elaPer = Config.getMasterPer(this.masterWalletId,"ELA");
            });
         }else if(result["Action"] === "OnBlockHeightIncreased"){
           if(result["progress"]){
            this.zone.run(() => {
              this.elaPer= result["progress"];
              Config.setMasterPer(this.masterWalletId,"ELA",this.elaPer);
              //this.localStorage.setProgress(Config.perObj);
            });
           }

         }

         if(this.elaPer === 1){
            this.zone.run(() => {
            this.elaPer = Config.getMasterPer(this.masterWalletId,"ELA");
          });
         }
      }


      handleIdchain(coin,result){
        if(result["Action"] === "OnBalanceChanged"){
          if(!Util.isNull(result["Balance"])){
            if(this.coinList.length === 0){
              this.coinList.push({name:coin, balance: result["Balance"]/Config.SELA});
             }else{
                let index = this.getCoinIndex(coin);
                if(index!=-1){
                   let item = this.coinList[index];
                       item["balance"] = result["Balance"]/Config.SELA;
                       this.coinList.splice(index,1,item);

                }else{
                      this.coinList.push({name: coin, balance: result["Balance"]/Config.SELA});
                }
             }
          }
        }

        if(result["Action"] === "OnTransactionStatusChanged"){
          if (result['confirms'] == 1) {
            this.handleSubwallet();
            this.popupProvider.ionicAlert('confirmTitle', 'confirmTransaction').then((data) => {
            });
          }
         }

          if(result["Action"] === "OnBlockSyncStopped"){

            this.zone.run(() => {
              this.idChainPer = Config.getMasterPer(this.masterWalletId,coin);
            });

          }else if(result["Action"] === "OnBlockSyncStarted"){
            this.zone.run(() => {
              this.idChainPer = Config.getMasterPer(this.masterWalletId,coin);
            });
          }else if(result["Action"] === "OnBlockHeightIncreased"){
            this.zone.run(() => {
              this.idChainPer  = result["progress"];
              Config.setMasterPer(this.masterWalletId,coin,this.idChainPer);
              //this.localStorage.setProgress(Config.perObj);
            });


          }

          if(this.idChainPer === 1){
                  this.zone.run(() => {
                    this.idChainPer = Config.getMasterPer(this.masterWalletId,coin);
                  });
          }
      }

      doRefresh(refresher){
        //this.init();
        this.getElaBalance(this.ElaObj);
        this.handleSubwallet();
        setTimeout(() => {
          refresher.complete();
        },1000);
      }
}
