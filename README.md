# Oheya

ここはインターネットのどこかにある、誰かのお部屋。

[https://oheya.nito008.com](https://oheya.nito008.com)

## Install

```sh
vp install
```

## Dev Server

```sh
vp run dev
```

> [!NOTE]
> 初回起動時前に`vp run build`を実行してdistフォルダを生成する必要があります。

## Preview Server

```sh
vp run build && vp run serve
```

## DB Migration

```sh
vp run db:migrate
```

## DB Preview

```sh
vp run db:studio
```

## Cf-Workers Types

```sh
vp run cf-typegen
```

> [!NOTE]
> .envの項目を追加した場合は型の再生成、`src/routes/plugin.ts`のEnvSchemaの更新が必要です。
