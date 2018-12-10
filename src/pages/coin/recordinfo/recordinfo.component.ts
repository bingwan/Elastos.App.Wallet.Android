import { Component} from '@angular/core';
import {Config} from '../../../providers/Config';
import { Util } from '../../../providers/Util';
import { NavController, NavParams} from 'ionic-angular';
import {WalletManager} from '../../../providers/WalletManager';
import {Native} from "../../../providers/Native";
@Component({
  selector: 'app-recordinfo',
  templateUrl: './recordinfo.component.html',
})
export class RecordinfoComponent{
  masterWalletId:string = "1";
  transactionRecord: any = {};
  start = 0;
  payStatusIcon: string = "";
  blockchain_url = Config.BLOCKCHAIN_URL;
  public myInterval:any;
  constructor(public navCtrl: NavController,public navParams: NavParams, public walletManager: WalletManager,public native :Native){
    //this.init();
  }
  ionViewWillEnter(){
    this.init();
    this.myInterval = setInterval(()=>{
        this.init();
    },1000);
 }

 ionViewDidLeave(){
  clearInterval(this.myInterval);
 }
  init() {
    this.masterWalletId = Config.getCurMasterWalletId();
    let txId = this.navParams.get("txId");
    let chainId = this.navParams.get("chainId");
    this.walletManager.getAllTransaction(this.masterWalletId,chainId, this.start, txId, (data) => {
      if(data["success"]){
        this.native.info(data);
        let allTransaction = JSON.parse(data['success']);
        let transactions = allTransaction['Transactions'];
        let transaction = transactions[0];
        // let timestamp = transaction['Timestamp']*1000;
        let summary = transaction['Summary'];
        let timestamp = summary['Timestamp']*1000;
        let datetime = Util.dateFormat(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
        let incomingAmount = summary["Incoming"]['Amount'];
        let outcomingAmount = summary["Outcoming"]['Amount'];
        let incomingAddress = summary["Incoming"]['ToAddress'];
        let outcomingAddress = summary["Outcoming"]['ToAddress'];
        let balanceResult = incomingAmount - outcomingAmount;
        let resultAmount = 0;
        if (outcomingAmount === 0 && outcomingAddress === "") {
          resultAmount = balanceResult;
        } else {
          resultAmount = balanceResult - summary['Fee'];
        }
        let status = '';
        switch(summary["Status"])
        {
          case 'Confirmed':
            status = 'Confirmed'
            break;
          case 'Pending':
            status = 'Pending'
            break;
          case 'Unconfirmed':
            status = 'Unconfirmed'
            break;
        }
        if (balanceResult > 0) {
          this.payStatusIcon = './assets/images/tx-state/icon-tx-received-outline.svg';
        } else if(balanceResult < 0) {
          this.payStatusIcon = './assets/images/tx-state/icon-tx-sent.svg';
        } else if(balanceResult == 0) {
          this.payStatusIcon = './assets/images/tx-state/icon-tx-moved.svg';
        }

        this.transactionRecord = {
          name: chainId,
          status: status,
          balance: Util.scientificToNumber(balanceResult/Config.SELA),
          incomingAmount: Util.scientificToNumber(incomingAmount/Config.SELA),
          outcomingAmount:Util.scientificToNumber(outcomingAmount/Config.SELA),
          resultAmount: Util.scientificToNumber(resultAmount/Config.SELA),
          incomingAddress: incomingAddress,
          outcomingAddress: outcomingAddress,
          txId: txId,
          transactionTime: datetime,
          timestamp: timestamp,
          payfees: Util.scientificToNumber(summary['Fee']/Config.SELA),
          confirmCount: summary["ConfirmStatus"],
          remark: summary["Remark"]
        }
      }else{
          alert("======getAllTransaction====error"+JSON.stringify(data));
      }

    });
  }

  onNext(address){
    this.native.copyClipboard(address);
    this.native.toast_trans('copy-ok');
  }

  tiaozhuan(txId){
   self.location.href=this.blockchain_url + 'tx/' + txId;
  }

  doRefresh(refresher){
    this.init();
    setTimeout(() => {
      refresher.complete();
    },1000);
  }

}
