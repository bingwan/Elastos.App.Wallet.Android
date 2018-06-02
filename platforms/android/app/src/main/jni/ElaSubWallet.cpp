// Copyright (c) 2012-2018 The Elastos Open Source Project
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include "ElaUtils.h"
#include "ISubWallet.h"
#include "nlohmann/json.hpp"

using namespace Elastos::SDK;

#define  CLASS_SUBWALLET   "com/elastos/spvcore/ISubWallet"
#define  FIELD_SUBWALLET   "mSubProxy"

static jstring JNICALL nativeGetBalanceInfo(JNIEnv *env, jobject clazz, jlong jSubProxy)
{
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->GetBalanceInfo();
    return env->NewStringUTF(result.c_str());
}

static jlong JNICALL nativeGetBalance(JNIEnv *env, jobject clazz, jlong jSubProxy)
{
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    return (jlong)subWallet->GetBalance();
}

static jstring JNICALL nativeCreateAddress(JNIEnv *env, jobject clazz, jlong jSubProxy)
{
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->CreateAddress();
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeGetAllAddress(JNIEnv *env, jobject clazz, jlong jSubProxy, jint jStart, jint jCount)
{
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->GetAllAddress(jStart, jCount);
    return env->NewStringUTF(result.c_str());
}

static jlong JNICALL nativeGetBalanceWithAddress(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jaddress)
{
    const char* address = env->GetStringUTFChars(jaddress, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    uint64_t result = subWallet->GetBalanceWithAddress(address);

    env->ReleaseStringUTFChars(jaddress, address);
    return (jlong)result;
}

class ElaSubWalletCallback: public ISubWalletCallback
{
public:
    virtual void OnTransactionStatusChanged(
            const std::string &txid,
            const std::string &status,
            const nlohmann::json &desc,
            uint32_t confirms);

    ElaSubWalletCallback(
        /* [in] */ JNIEnv* env,
        /* [in] */ jobject jobj);

    ~ElaSubWalletCallback();

private:
    JNIEnv* GetEnv();
    void Detach();

private:
    JavaVM* mVM;
    jobject mObj;
};


static std::map<jobject, ElaSubWalletCallback*> sSubCallbackMap;
static void JNICALL nativeAddCallback(JNIEnv *env, jobject clazz, jlong jSubProxy, jobject jsubCallback)
{
    ElaSubWalletCallback* subCallback = new ElaSubWalletCallback(env, clazz);
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    subWallet->AddCallback(subCallback);
    sSubCallbackMap[jsubCallback] = subCallback;
}

static void JNICALL nativeRemoveCallback(JNIEnv *env, jobject clazz, jlong jSubProxy, jobject jsubCallback)
{
    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::map<jobject, ElaSubWalletCallback*>::iterator it;
    for (it = sSubCallbackMap.begin(); it != sSubCallbackMap.end(); it++) {
        if (jsubCallback == it->first) {
            subWallet->RemoveCallback(it->second);
            delete it->second;
            sSubCallbackMap.erase(it);
            break;
        }
    }
}

static jstring JNICALL nativeSendTransaction(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jfromAddress,
        jstring jtoAddress, jlong amount, jlong fee, jstring jpayPassword, jstring jmemo)
{
    const char* fromAddress = env->GetStringUTFChars(jfromAddress, NULL);
    const char* toAddress = env->GetStringUTFChars(jtoAddress, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);
    const char* memo = env->GetStringUTFChars(jmemo, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->SendTransaction(fromAddress, toAddress, amount, fee, payPassword, memo);

    env->ReleaseStringUTFChars(jfromAddress, fromAddress);
    env->ReleaseStringUTFChars(jtoAddress, toAddress);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    env->ReleaseStringUTFChars(jmemo, memo);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeCreateMultiSignAddress(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jmultiPublicKeyJson,
        jint totalSignNum, jint requiredSignNum)
{
    const char* multiPublicKeyJson = env->GetStringUTFChars(jmultiPublicKeyJson, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->CreateMultiSignAddress(multiPublicKeyJson, totalSignNum, requiredSignNum);

    env->ReleaseStringUTFChars(jmultiPublicKeyJson, multiPublicKeyJson);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeGenerateMultiSignTransaction(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jfromAddress,
        jstring jtoAddress, jlong amount, jlong fee, jstring jpayPassword, jstring jmemo)
{
    const char* fromAddress = env->GetStringUTFChars(jfromAddress, NULL);
    const char* toAddress = env->GetStringUTFChars(jtoAddress, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);
    const char* memo = env->GetStringUTFChars(jmemo, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->GenerateMultiSignTransaction(fromAddress, toAddress, amount, fee, payPassword, memo);

    env->ReleaseStringUTFChars(jfromAddress, fromAddress);
    env->ReleaseStringUTFChars(jtoAddress, toAddress);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    env->ReleaseStringUTFChars(jmemo, memo);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeSendRawTransaction(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jtransactionJson, jstring jsignJson)
{
    const char* transactionJson = env->GetStringUTFChars(jtransactionJson, NULL);
    const char* signJson = env->GetStringUTFChars(jsignJson, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->SendRawTransaction(transactionJson, signJson);

    env->ReleaseStringUTFChars(jtransactionJson, transactionJson);
    env->ReleaseStringUTFChars(jsignJson, signJson);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeGetAllTransaction(JNIEnv *env, jobject clazz, jlong jSubProxy, jint start,
        jint count, jstring jaddressOrTxid)
{
    const char* addressOrTxid = env->GetStringUTFChars(jaddressOrTxid, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->GetAllTransaction(start, count, addressOrTxid);

    env->ReleaseStringUTFChars(jaddressOrTxid, addressOrTxid);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeSign(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jmessage, jstring jpayPassword)
{
    const char* message = env->GetStringUTFChars(jmessage, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->Sign(message, payPassword);

    env->ReleaseStringUTFChars(jmessage, message);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    return env->NewStringUTF(result.c_str());
}

static jstring JNICALL nativeCheckSign(JNIEnv *env, jobject clazz, jlong jSubProxy, jstring jaddress, jstring jmessage, jstring jsignature)
{
    const char* address = env->GetStringUTFChars(jaddress, NULL);
    const char* message = env->GetStringUTFChars(jmessage, NULL);
    const char* signature = env->GetStringUTFChars(jsignature, NULL);

    ISubWallet* subWallet = (ISubWallet*)jSubProxy;
    std::string result = subWallet->CheckSign(address, message, signature);

    env->ReleaseStringUTFChars(jaddress, address);
    env->ReleaseStringUTFChars(jmessage, message);
    env->ReleaseStringUTFChars(jsignature, signature);
    return env->NewStringUTF(result.c_str());
}


static const JNINativeMethod gMethods[] = {
    {"nativeGetBalanceInfo", "(J)Ljava/lang/String;", (void*)nativeGetBalanceInfo},
    {"nativeGetBalance", "(J)J", (void*)nativeGetBalance},
    {"nativeCreateAddress", "(J)Ljava/lang/String;", (void*)nativeCreateAddress},
    {"nativeGetAllAddress", "(JII)Ljava/lang/String;", (void*)nativeGetAllAddress},
    {"nativeGetBalanceWithAddress", "(JLjava/lang/String;)J", (void*)nativeGetBalanceWithAddress},
    {"nativeAddCallback", "(JLcom/elastos/spvcore/ISubWalletCallback;)V", (void*)nativeAddCallback},
    {"nativeRemoveCallback", "(JLcom/elastos/spvcore/ISubWalletCallback;)V", (void*)nativeRemoveCallback},
    {"nativeSendTransaction", "(JLjava/lang/String;Ljava/lang/String;JJLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeSendTransaction},
    {"nativeGenerateMultiSignTransaction", "(JLjava/lang/String;Ljava/lang/String;JJLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeGenerateMultiSignTransaction},
    {"nativeCreateMultiSignAddress", "(JLjava/lang/String;II)Ljava/lang/String;", (void*)nativeCreateMultiSignAddress},
    {"nativeSendRawTransaction", "(JLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeSendRawTransaction},
    {"nativeGetAllTransaction", "(JIILjava/lang/String;)Ljava/lang/String;", (void*)nativeGetAllTransaction},
    {"nativeSign", "(JLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeSign},
    {"nativeCheckSign", "(JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z", (void*)nativeCheckSign},
};

jint register_elastos_spv_ISubWallet(JNIEnv *env)
{
    return jniRegisterNativeMethods(env, "com/elastos/spvcore/ISubWallet",
        gMethods, NELEM(gMethods));
}

ElaSubWalletCallback::ElaSubWalletCallback(
    /* [in] */ JNIEnv* env,
    /* [in] */ jobject jobj)
{
    mObj = env->NewGlobalRef(jobj);
    env->GetJavaVM(&mVM);
}

ElaSubWalletCallback::~ElaSubWalletCallback()
{
    if (mObj) {
        GetEnv()->DeleteGlobalRef(mObj);
    }
}

JNIEnv* ElaSubWalletCallback::GetEnv()
{
    JNIEnv* env;
    assert(mVM != NULL);
    mVM->AttachCurrentThread(&env, NULL);
    return env;
}

void ElaSubWalletCallback::Detach()
{
    assert(mVM != NULL);
    mVM->DetachCurrentThread();
}

void ElaSubWalletCallback::OnTransactionStatusChanged(const std::string &txid, const std::string &status,
    const nlohmann::json &desc, uint32_t confirms)
{
    JNIEnv* env = GetEnv();

    jclass clazz = env->GetObjectClass(mObj);
    //"(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V"
    jmethodID methodId = env->GetMethodID(clazz, "OnTransactionStatusChanged","(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V");
    jstring jtxid = env->NewStringUTF(txid.c_str());
    jstring jstatus = env->NewStringUTF(status.c_str());
    std::string tmp = desc;
    jstring jdesc = env->NewStringUTF(tmp.c_str());

    env->CallVoidMethod(mObj, methodId, jtxid, jstatus, jdesc, confirms);

    Detach();
}