# doggoo

Just download the novel.

## License

**GPLv3**.

## How To Use

open cmd.exe, try input:

``` cmd
node main.js https://www.lightnovel.cn/thread-899097-1-1.html
```

if you try to output txt file, try:

``` cmd
node main.js https://www.lightnovel.cn/thread-899097-1-1.html --gen txt
```

### options

#### gen

Setup output format.

* txt
* epub (default)
* markdown

#### cc

Support chinese convert.

* hk2s : hongKongToSimplified,
* s2hk : simplifiedToHongKong,
* s2t  : simplifiedToTraditional,
* s2tw : simplifiedToTaiwan,
* t2hk : traditionalToHongKong,
* t2s  : traditionalToSimplified,
* t2tw : traditionalToTaiwan,
* tw2s : taiwanToSimplified,
