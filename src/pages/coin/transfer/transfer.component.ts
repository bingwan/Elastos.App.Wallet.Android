import {Component} from '@angular/core';
import {WalletManager} from '../../../providers/WalletManager';
import {Native} from "../../../providers/Native";
import {LocalStorage} from "../../../providers/Localstorage";
import {ContactListComponent} from "../../contacts/contact-list/contact-list.component";
import {TabsComponent} from "../../tabs/tabs.component";
import {Util} from "../../../providers/Util";
import { Config } from '../../../providers/Config';
import {IDManager} from "../../../providers/IDManager";
import {ApiUrl} from "../../../providers/ApiUrl"
import {IdResultComponent} from "../../../pages/id/result/result";
import {ScancodePage} from '../../../pages/scancode/scancode';
import { NavController, NavParams,ModalController,Events } from 'ionic-angular';
import {PaymentboxPage} from '../../../pages/paymentbox/paymentbox';
@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html'})
export class TransferComponent {
  masterWalletId:string = "1";
  walletType = "";
  transfer: any = {
    toAddress: '',
    amount: '',
    memo: '',
    fee: 0,
    payPassword:'',//hptest
    remark:'',
  };

  balance = 0;

  chianId: string;

  feePerKb = 10000;

  rawTransaction: '';

  SELA = Config.SELA;
  appType:string="";
  selectType:string="";
  parms:any;
  txId:string;
  did:string;
  isInput = false;
  walletInfo = {};
  constructor(public navCtrl: NavController,public navParams: NavParams, public walletManager: WalletManager,
    public native: Native,public localStorage:LocalStorage,public modalCtrl: ModalController,public events :Events ){
         this.init();
    }
  init() {
    this.events.subscribe("address:update",(address)=>{
        this.transfer.toAddress = address;
    });
    this.masterWalletId = Config.getCurMasterWalletId();
    let transferObj =this.navParams.data;
    this.chianId = transferObj["chianId"];
    this.transfer.toAddress = transferObj["addr"] || "";
    this.transfer.amount = transferObj["money"] || "";
    this.appType = transferObj["appType"] || "";
    if(this.appType==""){
        this.isInput = false;
    }else{
        this.isInput = true;
    }
    this.selectType = transferObj["selectType"] || "";
    this.parms = transferObj["parms"] || "";
    this.did = transferObj["did"] || "";
    this.walletInfo = transferObj["walletInfo"] || {};
    this.initData();
  }

  rightHeader(){
    this.native.scan().then((q)=>{
      let result = q.text;
      if (result.indexOf('elastos') != -1) {
        this.transfer.toAddress = result.split(":")[1];
      } else {
        this.transfer.toAddress = result.split(":")[0];
      }
    }).catch(err=>{
        this.native.toast_trans('error-address');
    });
  }

  initData(){
    this.walletManager.getBalance(this.masterWalletId,this.chianId, (data)=>{
      if(!Util.isNull(data["success"])){
        this.balance = data["success"];
      }else{
       alert("===getBalance===error"+JSON.stringify(data));
      }
    });
  }


  onClick(type) {
    switch (type) {
      case 1:
        this.native.Go(this.navCtrl,ContactListComponent,{"hideButton":true});
        break;
      case 2:   // 转账
        this.checkValue();
        break;
    }

  }

  checkValue() {
    if(Util.isNull(this.transfer.toAddress)){
      this.native.toast_trans('correct-address');
      return;
    }
    if(Util.isNull(this.transfer.amount)){
      this.native.toast_trans('amount-null');
      return;
    }
    if(!Util.number(this.transfer.amount)){
      this.native.toast_trans('correct-amount');
      return;
    }
    if(this.transfer.amount > this.balance){
      this.native.toast_trans('error-amount');
      return;
    }
    this.walletManager.isAddressValid(this.masterWalletId,this.transfer.toAddress, (data) => {
      if (!data['success']) {
        this.native.toast_trans("contact-address-digits");
        return;
      }

      console.log("====this.walletInfoType======"+this.walletInfo["Type"]);
      this.native.showLoading().then(()=>{
        if(this.walletInfo["Type"] === "Standard"){
          this.createTransaction();
      }else if(this.walletInfo["Type"] === "Multi-Sign"){
        console.log("====this.walletInfoType======"+this.walletInfo["Type"]);
          this.createMultTx();
      }
      });
    });
  }

  createTransaction(){
    this.walletManager.createTransaction(this.masterWalletId,this.chianId, "",
      this.transfer.toAddress,
      this.transfer.amount*Config.SELA,
      this.transfer.memo,
      this.transfer.remark,
      (data)=>{
        if(data['success']){
          console.log("=======createTransaction======"+JSON.stringify(data));
          this.rawTransaction = data['success'];
          this.getFee();
        }else{
          alert("====createTransaction====error"+JSON.stringify(data));
        }
      });
  }

  getFee(){
    this.walletManager.calculateTransactionFee(this.masterWalletId,this.chianId,this.rawTransaction, this.feePerKb, (data) => {
      if(data['success']){
        this.native.hideLoading();
        console.log("=======calculateTransactionFee======"+JSON.stringify(data));
        this.transfer.fee = data['success'];
        this.openPayModal(this.transfer);
      }else{
        alert("====calculateTransactionFee====error"+JSON.stringify(data));
      }
    });
  }

  sendRawTransaction(){
    if(this.walletInfo["Type"] === "Multi-Sign" && this.walletInfo["Readonly"]){
        this.updateTxFee();
        return;
    }
    // if (!Util.password(this.transfer.payPassword)) {
    //   this.native.toast_trans("text-pwd-validator");
    //   return;
    // }
    this.updateTxFee();
  }

  updateTxFee(){
    this.walletManager.updateTransactionFee(this.masterWalletId,this.chianId,this.rawTransaction, this.transfer.fee,(data)=>{
                       if(data["success"]){
                        console.log("===updateTransactionFee===="+JSON.stringify(data));
                        if(this.walletInfo["Type"] === "Multi-Sign" && this.walletInfo["Readonly"]){
                                 this.readWallet(data["success"]);
                                 return;
                        }
                        this.singTx(data["success"]);
                       }else{
                         alert("=====updateTransactionFee=error==="+JSON.stringify(data));
                       }
    });
  }

  singTx(rawTransaction){
    this.walletManager.signTransaction(this.masterWalletId,this.chianId,rawTransaction,this.transfer.payPassword,(data)=>{
      if(data["success"]){
        console.log("===signTransaction===="+JSON.stringify(data));
        if(this.walletInfo["Type"] === "Standard"){
             this.sendTx(data["success"]);
        }else if(this.walletInfo["Type"] === "Multi-Sign"){
            this.walletManager.encodeTransactionToString(data["success"],(raw)=>{
                     if(raw["success"]){
                      this.native.hideLoading();
                      this.native.Go(this.navCtrl,ScancodePage,{"tx":{"chianId":this.chianId,"fee":this.transfer.fee/Config.SELA, "rawTransaction":raw["success"]}});
                     }else{
                      alert("=====encodeTransactionToString===error==="+JSON.stringify(raw));
                     }
            });
        }
       }else{
         alert("=====signTransaction=error==="+JSON.stringify(data));
       }
    });
  }

  sendTx(rawTransaction){
    console.log("===publishTransaction====rawTransaction"+rawTransaction);
     this.walletManager.publishTransaction(this.masterWalletId,this.chianId,rawTransaction,(data)=>{
      if(data["success"]){
        this.native.hideLoading();
        console.log("===publishTransaction===="+JSON.stringify(data));
        this.txId = JSON.parse(data['success'])["TxHash"];
        console.log("=======sendRawTransaction======"+JSON.stringify(data));
        console.log("=======this.appType======"+JSON.stringify(data));
        if(Util.isNull(this.appType)){
          console.log("ElastJs transfer.component ===TabsComponent==== setRootRouter");

          this.native.toast_trans('send-raw-transaction');
          this.native.setRootRouter(TabsComponent);
        }else if(this.appType === "kyc"){
             if(this.selectType === "enterprise"){
                  this.company();
             }else {
                  this.person();
             }
        }
       }else{
         alert("=====signTransaction=error==="+JSON.stringify(data));
       }
     })
  }

  company(){
    this.sendCompanyHttp(this.parms);
  }

  person(){
    this.sendPersonAuth(this.parms);
  }

  sendCompanyHttp(params){
    let timestamp = this.native.getTimestamp();
    params["timestamp"] = timestamp;
    params["txHash"] = this.txId;
    params["deviceID"] = Config.getdeviceID();
    let checksum = IDManager.getCheckSum(params,"asc");
    params["checksum"] = checksum;

    console.info("ElastJs sendCompanyHttp params "+ JSON.stringify(params));
    this.native.getHttp().postByAuth(ApiUrl.AUTH,params).toPromise().then(data => {
         if(data["status"] === 200){
          let authData= JSON.parse(data["_body"]);
          console.info("Elastjs sendCompanyHttp authData" + JSON.stringify(authData));
          if(authData["errorCode"] === "0"){
               let serialNum = authData["serialNum"];
               let serIds = Config.getSerIds();
               serIds[serialNum] = {
                "id":this.did,
                "path":this.selectType,
                "serialNum":serialNum,
                "txHash":this.txId
               };
              Config.setSerIds(serIds);
              this.saveKycSerialNum(serialNum);
          }else{
              alert("sendCompanyHttp 错误码:"+authData["errorCode"]);
          }
         }

    }).catch(error => {
      alert("错误码:"+ JSON.stringify(error));
         this.native.Go(this.navCtrl,IdResultComponent,{'status':'1'});
    });
}

sendPersonAuth(parms){
      let timestamp = this.native.getTimestamp();
      parms["timestamp"] = timestamp;
      parms["txHash"] = this.txId;
      parms["deviceID"] = Config.getdeviceID();
      let checksum = IDManager.getCheckSum(parms,"asc");
      parms["checksum"] = checksum;
      console.log("---pesonParm---"+JSON.stringify(parms));
      console.info("ElastJs sendPersonAuth params "+ JSON.stringify(parms));


  this.native.getHttp().postByAuth(ApiUrl.AUTH,parms).toPromise().then(data=>{
        if(data["status"] === 200){

          let authData= JSON.parse(data["_body"])
          console.log('ElastJs sendPersonAuth return data ---authData---'+JSON.stringify(authData));
          if(authData["errorCode"] === "0"){

            console.log('ElastJs sendPersonAuth errorCode == 0');

            let serialNum = authData["serialNum"];
               let serIds = Config.getSerIds();
               serIds[serialNum] = {
                "id":this.did,
                "path":this.selectType,
                "serialNum":serialNum,
                "txHash":this.txId
               }
               console.log('ElastJs sendPersonAuth selectType '+ this.selectType +" serialNum " + serialNum);
               Config.setSerIds(serIds);
               this.saveKycSerialNum(serialNum);
          }else{
              alert("错误码:"+authData["errorCode"]);
          }
         }
      }).catch(error => {
        this.navCtrl.pop();
        this.native.Go(this.navCtrl,IdResultComponent,{'status':'0'});
      });
}

saveKycSerialNum(serialNum){
  console.log('ElastJs saveKycSerialNum serialNum begin'+ serialNum);

  this.localStorage.getKyc().then((val)=>{
        let masterWalletId = Config.getCurMasterWalletId();

        let idsObj = JSON.parse(val);
         let serialNumObj = idsObj[masterWalletId][this.did][this.selectType][serialNum];
         serialNumObj["txHash"] = this.txId;
         serialNumObj["pathStatus"] = 1;

         this.localStorage.setKyc(idsObj).then((newVal)=>{
                this.navCtrl.pop();
                this.native.Go(this.navCtrl,IdResultComponent,{'status':'0',id:this.did,path:this.selectType});
         });
     })
}

createMultTx(){
  this.walletManager.createMultiSignTransaction(this.masterWalletId,this.chianId,"",
  this.transfer.toAddress,
  this.transfer.amount*Config.SELA,
  this.transfer.memo,
  (data)=>{
    if(data["success"]){
      console.log("====createMultiSignTransaction======"+JSON.stringify(data));
      this.rawTransaction = data['success'];
      this.getFee();
    }else{
      alert("====createMultiSignTransaction==error===="+JSON.stringify(data));
    }
  }
)
}

readWallet(raws){
  this.walletManager.encodeTransactionToString(raws,(raw)=>{
    if(raw["success"]){
      this.native.hideLoading();
      this.native.Go(this.navCtrl,ScancodePage,{"tx":{"chianId":this.chianId,"fee":this.transfer.fee/Config.SELA, "raw":raw["success"]}});
    }else{
     alert("=====encodeTransactionToString===error==="+JSON.stringify(raw));
    }
});
}

  // ionViewDidLeave() {
  //    this.events.unsubscribe("error:update");
  // }
  openPayModal(data){
    let transfer = this.native.clone(data);
    const modal = this.modalCtrl.create(PaymentboxPage,transfer);
    modal.onDidDismiss(data => {
      if(data){
        this.native.showLoading().then(()=>{
          this.transfer = this.native.clone(data);
          this.sendRawTransaction();
        });
      }
    });
    modal.present();
  }

}
