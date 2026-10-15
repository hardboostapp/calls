# Chamadas: Bubble e Os cria da quebrada

Este repositório distribui instaladores e atualizações dos dois aplicativos. Os convites, credenciais, redes privadas e configurações pessoais não são publicados aqui.

## Baixar

Abra [Releases](https://github.com/hardboostapp/calls/releases) e escolha o aplicativo:

- **Bubble**: tags `bubble-v2.4.0`, `bubble-v2.4.1` etc. Windows: `bubble-windows-VERSAO.exe`. Android: `bubble-android-VERSAO.apk`.
- **Os cria da quebrada**: tags `cria-v1.0.0`, `cria-v1.0.1` etc. Windows: `cria-windows-VERSAO.exe`. Android: `cria-android-VERSAO.apk`.

No Windows, instale uma vez pelo novo instalador; ele mantém a sala e as preferências. Versões portáteis anteriores precisam desta primeira instalação. No Android, instale o APK por cima do anterior. Cada aplicativo exige seu convite privado. A chamada pode funcionar diretamente pela internet; se a rede impedir essa conexão, conecte os participantes à rede Tailscale correspondente.

## Como as atualizações aparecem

Ao abrir ou voltar ao aplicativo, ele consulta o canal correspondente. O aviso fica dentro do aplicativo. A consulta não abre janelas por cima de jogos nem instala nada automaticamente. A pessoa escolhe baixar e depois instalar; a instalação encerra a chamada e preserva suas preferências.

Windows verifica o checksum SHA-512 do instalador pela biblioteca `electron-updater`. Android verifica SHA-256, pacote, versão e certificado do APK antes de entregar a instalação ao sistema. A conta do GitHub não precisa ficar conectada nos aparelhos.

## Publicar uma versão nova

1. Atualize a versão do aplicativo; no Android, aumente também `versionCode`. Mantenha a chave de assinatura do APK guardada fora deste repositório.
2. Compile e teste as plataformas que serão atualizadas. Uma release pode atualizar apenas Windows ou apenas Android; a outra plataforma continua selecionando sua última versão compatível.
3. Crie uma **Draft release** com tag `bubble-vX.Y.Z` ou `cria-vX.Y.Z`.
4. Anexe apenas os arquivos das plataformas atualizadas: para Windows, `PRODUTO-windows-X.Y.Z.exe`, o respectivo `.blockmap` e `latest.yml` gerado pelo Electron Builder; para Android, `PRODUTO-android-X.Y.Z.apk`. Não renomeie um APK antigo como se fosse a nova versão.
5. Publique a release quando todos os arquivos estiverem prontos. Não marque versões de produção como pré-release.

O `latest.yml` deve estar na mesma release do instalador. Cada aplicativo seleciona sua própria tag, mesmo que a release mais recente do repositório seja do outro aplicativo. Versões iguais, inferiores, drafts e pré-releases são ignoradas.

Não anexe convites, arquivos de preferências, chaves, `.jks`, senhas, `.dpapi`, `.bubble` ou `.cria`.
