import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Native } from '../../../../providers/Native';
import {WalletManager} from '../../../../providers/WalletManager';
import { Config } from '../../../../providers/Config';
/**
 * Generated class for the MyvotePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-myvote',
  templateUrl: 'myvote.html',
})
export class MyvotePage {
    public masterWalletId:string = "1";
    public walletName:string ="";
    public totalNum = 1100;
    public voteList = [{"name":"xxxxxxx","votes":"No5"},{"name":"xxxxxxx1111","votes":"No6"}];
    //public voteList = [];
  constructor(public navCtrl: NavController, public navParams: NavParams,public native: Native,public walletManager: WalletManager) {
    this.masterWalletId = Config.getCurMasterWalletId();
    this.walletName = Config.getWalletName(this.masterWalletId);
    this.getVotedProducerList();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MyvotePage');
  }

  changevote(){
      this.native.Go(this.navCtrl,"PointvotePage",{"selectNode":["0312cd36dda4202f2a705ba6583eede20c879f2969a81d64232eb398e2e10dfcde","03336e36b8642235f658465bf65032ba83c2aea29b945c2dd0dfa771ce0a9aca14"]});
  }

  getVotedProducerList(){
    this.walletManager.getVotedProducerList(this.masterWalletId,"ELA",(data)=>{
      if(data["success"]){
        this.native.info(data);
        let productList = JSON.parse(data);
        if(productList){

        }
      }
    });
  }
}
