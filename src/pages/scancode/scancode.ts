import { Component } from '@angular/core';
import { NavController, NavParams,Platform} from 'ionic-angular';
import {Native} from "../../providers/Native";
import {WalletManager} from '../../providers/WalletManager'
import { Config } from '../../providers/Config';

@Component({
  selector: 'page-scancode',
  templateUrl: 'scancode.html',
})
export class ScancodePage {
  public qrcode: string=null;
  public txHash:string ="";
  public toAddress:string="";
  public fee:any;
  public amount:any;
  public iwidth:string=null;
  constructor(public navCtrl: NavController, public navParams: NavParams,public native: Native,public walletManager: WalletManager,public plt:Platform) {
           this.iwidth = (this.plt.width()-10).toString();
           let params = this.navParams.data;
           this.fee = params["tx"]["fee"];
          let  txObj  = params["tx"]["raw"];
           this.walletManager.decodeTransactionFromString(txObj,(raw)=>{
            if(raw["success"]){
                this.native.info(raw);
                this.txHash = JSON.parse(raw["success"])["TxHash"];
                this.toAddress =JSON.parse(raw["success"])["Outputs"][0]["Address"];
                this.amount = JSON.parse(raw["success"])["Outputs"][0]["Amount"]/Config.SELA;
            }
         });
           this.qrcode = JSON.stringify(params);
           this.native.info(this.navParams.data);
  }

  ionViewDidLoad() {

  }

}
