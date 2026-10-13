package PACKAGE;
import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;

final class AppUpdates {
 static final String REPO="hardboostapp/calls",PRODUCT="PRODUCT",CURRENT="VERSION";
 final Activity activity;final Handler ui=new Handler(Looper.getMainLooper());
 final ExecutorService queue=Executors.newSingleThreadExecutor();
 JSONObject candidate;boolean busy;File ready;long lastCheck;String offered="";
 AppUpdates(Activity a){activity=a;}
 boolean active(){return !activity.isFinishing()&&!activity.isDestroyed();}
 void post(Runnable r){ui.post(()->{if(active())r.run();});}
 static int compare(String a,String b){String[] x=a.split("\\."),y=b.split("\\.");for(int n=0;n<3;n++){int d=Integer.compare(Integer.parseInt(x[n]),Integer.parseInt(y[n]));if(d!=0)return d;}return 0;}
 static boolean version(String v){return v.matches("(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)");}
 static boolean allowed(URL u){return "https".equals(u.getProtocol())&&u.getUserInfo()==null&&Arrays.asList("api.github.com","github.com","release-assets.githubusercontent.com","objects.githubusercontent.com").contains(u.getHost());}
 static HttpURLConnection open(String value)throws Exception {
  URL u=new URL(value);
  for(int n=0;n<6;n++){if(!allowed(u))throw new IOException("Endereço de atualização inválido.");HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setConnectTimeout(15000);c.setReadTimeout(20000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","calls-android-updater");c.setRequestProperty("Accept",u.getHost().equals("api.github.com")?"application/vnd.github+json":"application/octet-stream");int code=c.getResponseCode();if(code==301||code==302||code==303||code==307||code==308){String redirect=c.getHeaderField("Location");c.disconnect();u=new URL(u,redirect);continue;}if(code!=200){c.disconnect();throw new IOException(code==403||code==429?"O GitHub limitou a consulta. Tente mais tarde.":"Não consegui acessar a atualização. Tente novamente.");}return c;}throw new IOException("Redirecionamento inválido.");
 }
 static byte[] read(String url,int max)throws Exception {HttpURLConnection c=open(url);try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(out.size()+n>max)throw new IOException("Resposta de atualização inválida.");out.write(b,0,n);}return out.toByteArray();}finally{c.disconnect();}}
 void check(boolean manual){if(!active()||busy||(!manual&&System.currentTimeMillis()-lastCheck<600000))return;busy=true;lastCheck=System.currentTimeMillis();queue.execute(()->{try{
  JSONArray list=new JSONArray(new String(read("https://api.github.com/repos/"+REPO+"/releases?per_page=100",4*1024*1024),java.nio.charset.StandardCharsets.UTF_8));JSONObject found=null;String best=CURRENT;
  for(int i=0;i<list.length();i++){JSONObject r=list.getJSONObject(i);String tag=r.optString("tag_name"),prefix=PRODUCT+"-v";if(r.optBoolean("draft")||r.optBoolean("prerelease")||!tag.startsWith(prefix))continue;String v=tag.substring(prefix.length());if(!version(v)||compare(v,best)<=0)continue;JSONArray assets=r.optJSONArray("assets");if(assets==null)continue;String name=PRODUCT+"-android-"+v+".apk",url="https://github.com/"+REPO+"/releases/download/"+tag+"/"+name;
   for(int j=0;j<assets.length();j++){JSONObject a=assets.getJSONObject(j);if(name.equals(a.optString("name"))&&"uploaded".equals(a.optString("state"))&&url.equals(a.optString("browser_download_url"))&&a.optLong("size")>0&&a.optLong("size")<100*1024*1024&&a.optString("digest").matches("sha256:[a-fA-F0-9]{64}")){found=new JSONObject().put("version",v).put("url",url).put("size",a.getLong("size")).put("hash",a.getString("digest").substring(7));best=v;}}
  }
  candidate=found;post(()->{if(candidate!=null&&(manual||activity.hasWindowFocus())&&(manual||!offered.equals(candidate.optString("version"))))offer();else if(manual&&candidate==null)new AlertDialog.Builder(activity).setTitle("Atualizações").setMessage("Você está na versão mais recente · "+CURRENT).setPositiveButton("Pronto",null).show();});
 }catch(Exception e){if(manual)post(()->new AlertDialog.Builder(activity).setTitle("Atualizações").setMessage(e.getMessage()).setPositiveButton("Entendi",null).show());}finally{busy=false;}});}
 void offer(){offered=candidate.optString("version");new AlertDialog.Builder(activity).setTitle("Atualização disponível").setMessage("Versão "+offered+". Baixe e instale por cima desta versão. A sala e as preferências ficam salvas.").setNegativeButton("Depois",null).setPositiveButton("Baixar",(d,w)->download()).show();}
 void download(){if(busy||candidate==null)return;busy=true;JSONObject selected=candidate;
  final ProgressDialog progress=new ProgressDialog(activity);progress.setTitle("Baixando atualização");progress.setMessage("Preparando o APK…");progress.setCancelable(false);progress.show();
  queue.execute(()->{File tmp=new File(activity.getCacheDir(),"update.apk.part");HttpURLConnection conn=null;try{
   conn=open(selected.getString("url"));MessageDigest hash=MessageDigest.getInstance("SHA-256");long count=0,total=selected.getLong("size");
   try(InputStream in=conn.getInputStream();OutputStream out=new FileOutputStream(tmp)){byte[] b=new byte[32768];int n,last=-1;while((n=in.read(b))!=-1){count+=n;if(count>total||count>100*1024*1024)throw new IOException("O pacote de atualização é inválido.");hash.update(b,0,n);out.write(b,0,n);int percent=(int)(count*100/total);if(percent!=last){last=percent;final int p=percent;post(()->progress.setMessage("APK · "+p+"%"));}}}
   StringBuilder actual=new StringBuilder();for(byte b:hash.digest())actual.append(String.format(Locale.ROOT,"%02x",b&255));if(count!=total||!actual.toString().equalsIgnoreCase(selected.getString("hash")))throw new IOException("A verificação do download falhou. Tente novamente.");
   PackageManager pm=activity.getPackageManager();PackageInfo mine=pm.getPackageInfo(activity.getPackageName(),PackageManager.GET_SIGNING_CERTIFICATES),next=pm.getPackageArchiveInfo(tmp.getAbsolutePath(),PackageManager.GET_SIGNING_CERTIFICATES);
   if(next==null||!mine.packageName.equals(next.packageName)||!selected.getString("version").equals(next.versionName)||next.getLongVersionCode()<=mine.getLongVersionCode()||!Arrays.equals(mine.signingInfo.getApkContentsSigners(),next.signingInfo.getApkContentsSigners()))throw new IOException("Este APK não corresponde ao aplicativo instalado.");
   ready=new File(activity.getCacheDir(),"update.apk");if(ready.exists()&&!ready.delete())throw new IOException("Não consegui preparar a atualização.");if(!tmp.renameTo(ready))throw new IOException("Não consegui preparar a atualização.");post(()->{progress.dismiss();new AlertDialog.Builder(activity).setTitle("Atualização pronta").setMessage("A instalação encerra a chamada. Sua sala e preferências ficam salvas.").setNegativeButton("Depois",null).setPositiveButton("Instalar",(d,w)->install()).show();});
  }catch(Exception e){tmp.delete();post(()->{progress.dismiss();new AlertDialog.Builder(activity).setTitle("Não consegui atualizar").setMessage(e.getMessage()).setPositiveButton("Entendi",null).show();});}finally{if(conn!=null)conn.disconnect();busy=false;}});
 }
 void install(){if(ready==null||!ready.isFile())return;if(!activity.getPackageManager().canRequestPackageInstalls()){new AlertDialog.Builder(activity).setTitle("Permitir esta atualização").setMessage("O Android precisa da sua autorização para instalar atualizações deste aplicativo. Ative a permissão na próxima tela e volte para instalar.").setNegativeButton("Depois",null).setPositiveButton("Abrir ajustes",(d,w)->activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+activity.getPackageName())))).show();return;}Uri u=Uri.parse("content://"+activity.getPackageName()+".updates/update.apk");activity.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(u,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));}
 void resume(){if(ready!=null&&ready.isFile()&&activity.getPackageManager().canRequestPackageInstalls()){File f=ready;ready=null;new AlertDialog.Builder(activity).setTitle("Instalar atualização").setMessage("A versão nova está pronta. A chamada será encerrada ao instalar.").setNegativeButton("Depois",(d,w)->ready=f).setPositiveButton("Instalar",(d,w)->{ready=f;install();}).show();}}
 void close(){queue.shutdown();}
}
