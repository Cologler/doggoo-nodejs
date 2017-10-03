# doggoo

Just download the novel.

## License

**GPLv3**.

## How To Compile

For compile, you need to install `pkg`.

``` cmd
npm i -g pkg
```

then run the command:

``` cmd
npm run compile
```

You should found the binary executable file in `dist-bin` directory.

## How To Use

open cmd.exe, try input:

``` cmd
doggoo.exe https://www.lightnovel.cn/thread-899097-1-1.html
```

if you try to output txt file, try:

``` cmd
doggoo.exe https://www.lightnovel.cn/thread-899097-1-1.html --gen txt
```

### options

#### gen

Set output format.

* txt
* epub (default)
* markdown

#### output

Set output dir.

#### cc

Supported chinese convert:

* hk2s : hongKongToSimplified,
* s2hk : simplifiedToHongKong,
* s2t  : simplifiedToTraditional,
* s2tw : simplifiedToTaiwan,
* t2hk : traditionalToHongKong,
* t2s  : traditionalToSimplified,
* t2tw : traditionalToTaiwan,
* tw2s : taiwanToSimplified,
