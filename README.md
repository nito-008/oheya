# Oheya

## Install

```sh
vp install
```

## Dev Server

```sh
vp run dev
```

## Preview Server

```sh
vp run build && vp run serve
```

## DB Migration

```sh
vp run db:migrate
```

## Cf-Workers Types

```sh
vp run cf-typegen
```

> [!NOTE]
> .envの項目を追加した場合はCloudflare Workers用に型の再生成が必要です。
