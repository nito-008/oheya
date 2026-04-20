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
