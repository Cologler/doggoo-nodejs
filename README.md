# doggoo

Just download the novel.

**使用此工具生成的电子书禁止传播。**

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

*If you cannot download precompiled base binaries file, try take a look [this](https://gist.github.com/Cologler/083efd4537b3cbf66fa3eacad3d635ff).*

After compile, you should found the binary executable file in `dist-bin` directory.

## How To Use

open cmd.exe, try input:

``` cmd
doggoo.exe https://www.lightnovel.cn/thread-899097-1-1.html
```

if you try to output txt file, try:

``` cmd
doggoo.exe https://www.lightnovel.cn/thread-899097-1-1.html --format txt
```

### options

#### format

Set output format.

* epub (default)
* txt
* markdown

#### cc

Supported chinese convert:

* hk2s : hongKongToSimplified
* s2hk : simplifiedToHongKong
* s2t  : simplifiedToTraditional
* s2tw : simplifiedToTaiwan
* t2hk : traditionalToHongKong
* t2s  : traditionalToSimplified
* t2tw : traditionalToTaiwan
* tw2s : taiwanToSimplified

#### cookie

##### set by args

use `--cookie your_cookie`.

##### default cookie file

Auto load default cookie from file in current work directory named `doggoo_cookie.txt`.

##### load from file

`--cookie @cookie.txt` will load cookie from file `cookie.txt`.
