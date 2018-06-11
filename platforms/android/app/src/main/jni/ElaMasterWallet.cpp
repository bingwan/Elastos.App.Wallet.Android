// Copyright (c) 2012-2018 The Elastos Open Source Project
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include "ElaUtils.h"
#include "IMasterWallet.h"
#include "nlohmann/json.hpp"

using namespace Elastos::SDK;


//"(J)Ljava/lang/String;"
static jstring JNICALL nativeGetId(JNIEnv *env, jobject clazz, jlong jMasterProxy)
{
    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    std::string key = masterWallet->GetId();
    return env->NewStringUTF(key.c_str());
}

//"(J)[J"
static jlongArray JNICALL nativeGetAllSubWallets(JNIEnv *env, jobject clazz, jlong jMasterProxy)
{
    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    std::vector<ISubWallet *> array = masterWallet->GetAllSubWallets();

    const int length = array.size();
    jlong* proxies = new jlong[length];
    for (int i = 0; i < length; ++i) {
        proxies[i] = (jlong)array[i];
    }

    jlongArray jarray = env->NewLongArray(length);
    env->SetLongArrayRegion(jarray, 0, length, proxies);
    delete[] proxies;
    return jarray;
}

//"(JLjava/lang/String;Ljava/lang/String;ZJ)J"
static jlong JNICALL nativeCreateSubWallet(JNIEnv *env, jobject clazz, jlong jMasterProxy, jstring jChainID,
        jstring jpayPassword, jboolean jSingleAddress, jlong jFeePerKb)
{
    const char* chainID = env->GetStringUTFChars(jChainID, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);

    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    ISubWallet* subWallet = masterWallet->CreateSubWallet(chainID, payPassword, jSingleAddress, jFeePerKb);

    env->ReleaseStringUTFChars(jChainID, chainID);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    return (jlong)subWallet;
}

//"(JLjava/lang/String;Ljava/lang/String;ZIJ)J"
static jlong JNICALL nativeRecoverSubWallet(JNIEnv *env, jobject clazz, jlong jMasterProxy, jstring jChainID,
        jstring jpayPassword, jboolean jSingleAddress, jint limitGap, jlong jFeePerKb)
{
    const char* chainID = env->GetStringUTFChars(jChainID, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);

    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    ISubWallet* subWallet = masterWallet->RecoverSubWallet(chainID, payPassword, jSingleAddress, limitGap, jFeePerKb);

    env->ReleaseStringUTFChars(jChainID, chainID);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    return (jlong)subWallet;
}

//"(JJ)V"
static void JNICALL nativeDestroyWallet(JNIEnv *env, jobject clazz, jlong jMasterProxy, jlong jsubWalletProxy)
{
    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    ISubWallet* subWallet = (ISubWallet*)jsubWalletProxy;
    masterWallet->DestroyWallet(subWallet);
}

//"(J)Ljava/lang/String;"
static jstring JNICALL nativeGetPublicKey(JNIEnv *env, jobject clazz, jlong jMasterProxy)
{
    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    std::string key = masterWallet->GetPublicKey();
    return env->NewStringUTF(key.c_str());
}

//"(JLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;"
static jstring JNICALL nativeSign(JNIEnv *env, jobject clazz, jlong jMasterProxy, jstring jmessage, jstring jpayPassword)
{
    const char* message = env->GetStringUTFChars(jmessage, NULL);
    const char* payPassword = env->GetStringUTFChars(jpayPassword, NULL);

    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    std::string result = masterWallet->Sign(message, payPassword);

    env->ReleaseStringUTFChars(jmessage, message);
    env->ReleaseStringUTFChars(jpayPassword, payPassword);
    return env->NewStringUTF(result.c_str());
}

//"(JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;"
static /*nlohmann::json*/jstring JNICALL nativeCheckSign(JNIEnv *env, jobject clazz, jlong jMasterProxy, jstring jaddress, jstring jmessage,
        jstring jsignature)
{
    const char* address = env->GetStringUTFChars(jaddress, NULL);
    const char* message = env->GetStringUTFChars(jmessage, NULL);
    const char* signature = env->GetStringUTFChars(jsignature, NULL);

    IMasterWallet* masterWallet = (IMasterWallet*)jMasterProxy;
    nlohmann::json jsonVal = masterWallet->CheckSign(address, message, signature);

    std::stringstream ss;
    ss << jsonVal;

    env->ReleaseStringUTFChars(jaddress, address);
    env->ReleaseStringUTFChars(jmessage, message);
    env->ReleaseStringUTFChars(jsignature, signature);

    return env->NewStringUTF(ss.str().c_str());
}

static const JNINativeMethod gMethods[] = {
    {"nativeGetId", "(J)Ljava/lang/String;", (void*)nativeGetId},
    {"nativeGetAllSubWallets", "(J)[J", (void*)nativeGetAllSubWallets},
    {"nativeCreateSubWallet","(JLjava/lang/String;Ljava/lang/String;ZJ)J", (void*)nativeCreateSubWallet},
    {"nativeRecoverSubWallet", "(JLjava/lang/String;Ljava/lang/String;ZIJ)J", (void*)nativeRecoverSubWallet},
    {"nativeDestroyWallet", "(JJ)V", (void*)nativeDestroyWallet},
    {"nativeGetPublicKey", "(J)Ljava/lang/String;", (void*)nativeGetPublicKey},
    {"nativeSign", "(JLjava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeSign},
    {"nativeCheckSign", "(JLjava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;", (void*)nativeCheckSign},
};

jint register_elastos_spv_IMasterWallet(JNIEnv *env)
{
    return jniRegisterNativeMethods(env, "com/elastos/spvcore/IMasterWallet",
        gMethods, NELEM(gMethods));
}
