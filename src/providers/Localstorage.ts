import {Injectable} from '@angular/core';
import { Storage } from '@ionic/storage';
import {Config} from "./Config";

/***
 * 封装存储操作
 */
@Injectable()
export class LocalStorage {

  public  KYC_KEY = "kycId";

  constructor(private storage: Storage) { }

  public add(key: string, value: any): any {
    return this.get(key).then((val)=>{

     let id = value['id'];

     if(val === null){
      let initObj = {};
      initObj[id] = value;
      return this.storage.set(key, JSON.stringify(initObj));
     }
     let addObj = JSON.parse(val);
     addObj[id] = value;
     return this.storage.set(key, JSON.stringify(addObj));
    });
  }

  //did][path][serialNum
  public addKeyToSerialNum(masterWalletID : string, did: string, path: string , serialNum: string, keyAdd : string, obj : any, callback : any) {

    console.info("ElastJs addKeyToSerialNum begin masterWalletID " + masterWalletID);

    let idsObj = {};
    let self = this;
    this.getKyc().then((val)=>{

      console.info("ElastJs addKeyToSerialNum getKycList " + val);
      if(val == null || val === undefined || val === {} || val === ''){
        console.info("ElastJs addKeyToSerialNum getKycList err return ");

        return;
      }
      idsObj = JSON.parse(val);

      console.info("ElastJs addKeyToSerialNum  did "+ did + " path "+path + " serialNum "+ serialNum + " keyAdd "+ keyAdd + " obj " + JSON.stringify(obj));

      idsObj[masterWalletID][did][path][serialNum][keyAdd] = obj;
      console.info("ElastJs addKeyToSerialNum storage.set idsObj " + JSON.stringify(idsObj));

      self.setKyc(idsObj);
      callback();
    });

  }


  public set(key: string, value: any): any {
    return this.storage.set(key, JSON.stringify(value));
  }

  public get(key: string): any {
    return this.storage.get(key);
  }

  // get seqnumobj by id authtype(bankcard phone idcard enterprise) sign
  //key  id
  //appType kyc  and so on
  //authType  person  company
  public getSeqNumObj(masterWalletID : string, sign : string, id: string,  authType: string, callback : any ): any {

    console.info( "ElastosJs localstorage getSeqNumObj begin sign " + sign + " id "+ id + " authType " + authType);

    /////////////////
    this.getKyc().then((val)=>{
     let valObj = JSON.parse(val)[masterWalletID];

     console.info("ElastosJs getSeqNumObj total     valObj " + JSON.stringify(valObj));

      let  idJsonObj = valObj[id];

      //console.info( "ElastosJs localstorage getSeqNumObj idJsonObj " + JSON.stringify(idJsonObj) );

      let  seqNumObj;

      if (idJsonObj &&  idJsonObj[authType] )
      {

        let seqObjs = idJsonObj[authType];

        console.info( "ElastosJs localstorage getSeqNumObj order " + JSON.stringify(seqObjs));

        for(var prop in seqObjs){

          //sign ==
          //console.info( "ElastosJs localstorage prop " + prop);
          //console.info( "ElastosJs localstorage prop " + prop + " order.prop.params " + JSON.stringify(order[prop]["params"]));

          //console.info( "ElastosJs localstorage prop " + prop + " order.prop.params.adata " + JSON.stringify(order[prop]["params"]["adata"]));

          if ( seqObjs[prop]["adata"])
          {
            // var addataArry = [];
            // addataArry = seqObjs[prop]["adata"];

            seqObjs[prop]["adata"].forEach(function (value) {
             // console.info( "ElastosJs value " + JSON.stringify(value) + " typeof value " + typeof (value));
              if (value && value["resultSign"]) {

                console.info( "ElastosJs value[\"retdata\"] " + JSON.stringify(value["retdata"]));
                if (sign == value["resultSign"]) {

                  seqNumObj = seqObjs[prop];
                  console.info( "ElastosJs localstorage getSeqNumObj ok  seqNumObj " + JSON.stringify(seqNumObj));
                }
              }
            })
          }
        }
      }
      callback(seqNumObj);
      //return seqNumObj;

    });
    ////////////////

  }

  public remove(key: string): any {
    return this.storage.remove(key);
  }

  public clear(): any {
    return this.storage.clear();
  }

  public setWallet(value: any): any {
    // TODO
    let key = "ELA-Wallet";
    return this.storage.set(key, JSON.stringify(value));
  }

  public getWallet(): any {
    // TODO
    let key = "ELA-Wallet";
    return this.storage.get(key);
  }

  public addKyc(key: string, value: any):any{
    return this.storage.set(key, JSON.stringify(value));
  }

  public getKycList(key: string):any{
      return this.storage.get(key);
  }

  ///////////

  public addKycKey(masterWalletID: string , id: string, value: any): any {

    console.info("ElastJs addKycKey masterWalletID"+ masterWalletID + " id " + id+ " value " + JSON.stringify(value));
    let key = "kycId";
    return this.get(key).then((val)=>{

      console.info("ElastJs addKycKey get kycId val "+ JSON.stringify(val));

      let addObj = {};

      if(val){
        addObj = JSON.parse(val);
      }
      if (!addObj[masterWalletID]) {
        addObj[masterWalletID] = {};
      }
      addObj[masterWalletID][id] = value;

      console.info("ElastJs addKycKey get kycId addObj "+ JSON.stringify(addObj));
      return this.setKyc(addObj);
    });
  }
  public setKyc( value: any): any {//masterWalletId: string,

    let key = "kycId";
    // let obj ={
    //   key : {}
    // };
    //obj[key][masterWalletId] = value;
    console.info("ElastJs setKyc get kycId value "+ JSON.stringify(value));

    return this.storage.set(key, JSON.stringify(value));
  }

  public getKyc(): any {
    let key = "kycId";

    return this.storage.get(key);
  }

  /////////////////
  addOnChainContent(masterWalletId: string ,onChainConentObj : any , authType : string ){

    console.info("ElastJs home.ts begin addOnChainContent" + JSON.stringify(onChainConentObj) + " authType " + authType);
    let idsObj = {};
    this.getKyc().then((val)=>{

      console.info("ElastJs addOnChainContent getKycList " + val);
      if(val == null || val === undefined || val === {} || val === ''){
        console.info("ElastJs addOnChainContent getKycList err return ");

        return;
      }
      //let masterWalletId = Config.getCurMasterWalletId();

      idsObj = JSON.parse(val);

      //idsObj[masterWalletId][onChainConentObj.Id]
      if(!idsObj[masterWalletId][onChainConentObj.Id]["onChainContent"]){
        idsObj[masterWalletId][onChainConentObj.Id]["onChainContent"] ={};
      }

      idsObj[masterWalletId][onChainConentObj.Id]["onChainContent"][authType] = onChainConentObj;
      console.info("ElastJs addOnChainContent idsObj " + JSON.stringify(idsObj));

      this.setKyc(idsObj).then(()=>{
        console.info("ElastJs addOnChainContent pulish order ");

      });
    });
  }


/////////////////

  public getOnchainContent(masterWalletID: string , id: string, authType: string, callBack : any){

    console.info( "ElastosJs getOnchainContent begin masterWalletID " + masterWalletID + " id " + id + " authType "+ authType);

    this.getKyc().then((val)=>{
      let valObj = JSON.parse(val)[masterWalletID];

      console.info("ElastosJs getOnchainContent total     valObj " + JSON.stringify(valObj));

      let  idJsonObj = valObj[id];

      if ( idJsonObj )
      {
        if (idJsonObj["onChainContent"]) {
          console.info("ElastosJs getOnchainContent authType obj " + JSON.stringify(idJsonObj["onChainContent"][authType]));
          if(idJsonObj["onChainContent"][authType] && idJsonObj["onChainContent"][authType]['Contents']&&idJsonObj["onChainContent"][authType]['Contents'].length > 0){
            console.info("ElastosJs getOnchainContent end  []" + JSON.stringify(idJsonObj["onChainContent"][authType]['Contents'][0]['Values']));

            callBack(idJsonObj["onChainContent"][authType]['Contents'][0]['Values']);
          }
          else {
            console.info("ElastosJs getOnchainContent end  []" );
            callBack([]);
          }
        }
        else{
          console.info("ElastosJs getOnchainContent end  []" );
          callBack([]);
        }
      }

    });
  }
  public isAllReadyExist(masterWalletID: string , id: string, authType: string, unique_num : string, exludeSeriNum : string, callBack : any){

    console.info( "ElastosJs isAllReadyExist begin masterWalletID " + masterWalletID + " id " +
      id + " authType "+ authType + " unique_num " + unique_num + " exludeSeriNum " + exludeSeriNum);

    this.getKyc().then((val)=>{
      let valObj = JSON.parse(val)[masterWalletID];

      console.info("ElastosJs isAllReadyExist total     valObj " + JSON.stringify(valObj));

      let  idJsonObj = valObj[id];

      if ( idJsonObj && idJsonObj[authType])
      {
        let authObj = idJsonObj[authType];

        console.info("ElastosJs isAllReadyExist  authObj " + JSON.stringify(authObj));
        for (var seriNum in authObj){
          if (seriNum == exludeSeriNum){
            console.info("ElastosJs isAllReadyExist  seriNum == exludeSeriNum " + exludeSeriNum);

            continue;
          }
          //ignore failed
          if(authObj[seriNum]["pathStatus"] == 3){
                continue;
          }
          if((!authObj[seriNum]['payObj'])){
            console.info("ElastosJs isAllReadyExist  payObj error ");

            continue
          }
          if ((!authObj[seriNum]['payObj']["parms"])) {
            console.info("ElastosJs isAllReadyExist  parms error ");
            continue;
          }
          let  paramsObj= authObj[seriNum]['payObj']["parms"];

          switch (authType)
          {
            case "identityCard": {
              if (unique_num == paramsObj.identityNumber){
                callBack(true);
                return ;
              }
              break;
            }
            case "enterprise": {
              if (unique_num == paramsObj.registrationNum){
                callBack(true);
                return ;

              }
              break;
            }
            case "phone": {
              if (unique_num == paramsObj.mobile){
                callBack(true);
                return ;

              }
              break;
            }
            case "bankCard": {
              if (unique_num == paramsObj.cardNumber){
                callBack(true);
                return ;

              }
              break;
            }
          }
        }
      }
      callBack(false);
    });
  }
  ///////////
  public getLanguage(key):any{
      return this.storage.get(key);
  }


  public saveCurMasterId(value){
    // {masterId:"123"}
    let key = "cur-masterId";
    return this.storage.set(key, JSON.stringify(value));
  }

  public getCurMasterId(){
    let key = "cur-masterId";
    return this.storage.get(key);
  }

  public saveMappingTable(obj){
     let key = "map-table";
     return this.add(key,obj);
  }

  public getMappingTable(){
    let key = "map-table";
    return this.storage.get(key);
  }

}


