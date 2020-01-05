Vue.filter('formatDate', function (value) {
    if (value) {
      return moment(String(value)).format('MM/DD/YYYY hh:mm')
    }
  });

  var app = new Vue({
    el: '#app',

    data() {
      return {
        sa: [],
        selectedUrl: null,
        queue: [

        ],
        finded: [],
        queueTmp: {
          name: null,
          url: null,
          finded: 0,
          tick: 0,
          timer: 100,
          run: false,
          route: [],
          time: null,
        },
        pointTmp: {
          start: '',
          stop: ''
        },
        modalError: [],
        c: {},
        p: {},
        time: 1,
        notfy: true,
        autoBook: false,
        queueRun: true,
        errorOpen: false,
        token: null,
      }
    },
    mounted() {

      this.getSearch()
      this.c = this.bestCopyEver(this.queueTmp)
      this.p = this.bestCopyEver(this.pointTmp)
      let router = localStorage.getItem("router");
      if (router != null && router != '') {
        this.queue = JSON.parse(router);
      }

      toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-bottom-full-width",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }
      toastr.info('Hoşgeldiniz')

      this.queueRunner()
    },
    methods: {
      onChange(event) {
        this.queueTmp.name = this.queueTmp.url.searchFilterName
      },
      raw(item) {
        return JSON.stringify(item)
      },
      notifyMe(string) {
        if (this.notfy) {
          if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
          } else if (Notification.permission === "granted") {
            var notification = new Notification(string);
            var url = Notification.badge
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (permission) {
              if (permission === "granted") {
                var notification = new Notification(string);
                var url = Notification.badge
              }
            });
          }
        }
      },
      queueRunner() {
        this.time++
        if (this.queueRun) {
          for (let i = 0; i < this.queue.length; i++) {
            const element = this.queue[i];
            console.log(element)
            this.getLoad(element)

          }
        }
      },
      finder(data, queue) {
        let start = Date.now()
        console.log(' %c Arama çalıştı', 'color: #fe9801');
        let op = data.workOpportunities;
        for (let i = 0; i < op.length + 1; i++) {

          for (let rota = 0; rota < queue.route.length; rota++) {
            console.log(queue.route.length);


            const element = queue.route[rota];
            let timeControl = true;
            if (queue.time) {
              let date = new Date(op[i].firstPickupTime).getTime();
              let times = new Date(queue.time + ':00Z').getTime();
              timeControl = date > times
            };
            if (timeControl) {
              let status = false;



            }

          }


        }
        let end = Date.now()
        console.log(' %c Arama bitti ms:' + (end - start), 'color: #ccda46');

      },
      searcher(element, op) {
        for (let pointsOfElement = 0; pointsOfElement < element.point.length; pointsOfElement++) {

          let myPoint = element.point[pointsOfElement];
          let stops = op[i].loads[pointsOfElement].stops;
          let start = stops[0].location.label;
          let stop = stops[1].location.label;
          let startCheck = myPoint.start === '*' ? true : myPoint.start == start
          let stopCheck = myPoint.stop === '*' ? true : myPoint.stop == stop
          status = (startCheck && stopCheck);
        }
        if (status) {
          console.log(' %c Book için veri çıktı ', 'color: #697c37');

          if (this.autoBook) {
            console.log(' %c Book için harekete geçildi ' + op[i].id, 'color: #50d890');
            queue.run = false;
            let s = this.book(this.bestCopyEver(op[i]))
          }
          queue.finded = queue.finded + 1;
          this.finded.push(op[i]);
          this.finded = _.uniqBy(this.finded, 'id');
          toastr.success('Birtane bulundu');
          this.notifyMe('Yeni bir yük geldi');

        }
      },

      /* request */
      getSearch: function () {
        axios.get('https://relay.amazon.com/api/tours/loadboard/savedSearches?paginationToken=null&pageSize=50')
          .then((response) => {
            this.sa = response.data.savedSearchFilterList
          })
      },
      getLoad(element) {
        let url = this.makeUrl(element.url);
        console.log(' %c Yenilendi ', 'color: #c3f584');
        if (element.run && this.queueRun) {
          element.tick++
          axios.get(url)
            .then((response) => {
              this.finder(response.data, element)
              this.getLoad(element);
            }).catch(() => {
              this.getLoad(element);
            })
        }

      },
      book(item) {
        //https://relay.amazon.com/api/tours/loadboard/c8f90042-7776-4165-b835-a6afd5cd6d06/1/option/1
        //https://relay.amazon.com/api/tours/loadboard/32643856-513d-4020-9854-a4e33bfdbf29/12/option/1
        //https://relay.amazon.com/api/tours/loadboard/32643856-513d-4020-9854-a4e33bfdbf29/12/option/1
        // axios.defaults.headers.common['x-csrf-token'] = window.csfr
        axios.defaults.headers.common['x-csrf-token'] = this.token
        console.log(' %c Book başladı ', item, 'color: #b21f66');
        this.modalError = null
        axios.post('https://relay.amazon.com/api/tours/loadboard2/' + item.id + '/' + item.version + '/option/' + item.workOpportunityOptionId, {
            totalCost: item.payout,
            searchURL: ""
          })
          .then((response) => {
            console.log(' %c Book yapıldı', response, 'color: #c3f584');
            this.notifyMe('Book yaptım');
          }).catch((error) => {
            console.log(' %c Book hatalı', 'color: #f65c78');
            console.log(error);

            this.notifyMe('Book yapamadım hata aldım, motor durdurdum 1 dakkaya yeniden başlıcak veya siz başlatabilirsiniz');
            this.error = {
              error: error.response,
              item: item
            }
            this.modalError = this.error
          })
      },

      /* UI */
      bestCopyEver(src) {
        return Object.assign({}, src);
      },
      fresh() {
        this.finded = [];
        toastr.warning('Sitemde bulunanalar sıfırlandı')
      },
      keyd(item) {
        return Object.keys(item);
      },
      removeQueue(index) {
        this.queue.splice(index, 1)
        localStorage.setItem("router", JSON.stringify(this.queue));
      },
      stopQueue(index) {
        this.queue[index].finded = 0;
        this.queue[index].tick = 0;
        this.queue[index].run = !this.queue[index].run
        this.queueRunner()
      },
      editQueue(index) {
        this.queue[index].run = false;
        this.queueTmp = this.queue[index];
        this.queue.splice(index, 1)
        localStorage.setItem("router", JSON.stringify(this.queue));
      },
      addQueue() {
        let hand = this.bestCopyEver(this.queueTmp);
        this.queue.push(hand)
        this.queueTmp = null
        this.queueTmp = this.bestCopyEver(this.c);
        this.queueTmp.route = [];
        this.pointTmp = this.bestCopyEver(this.p)
        localStorage.setItem("router", JSON.stringify(this.queue));
        toastr.success('Başarılı bir şekilde kaydedildi')

      },
      clearStore() {
        localStorage.removeItem("router");
      },
      removePoint(index, rotaIndex) {
        this.queueTmp.route[rotaIndex].point.splice(index, 1)
      },
      addPoint(index) {
        let p = this.bestCopyEver(this.pointTmp);
        this.queueTmp.route[index].point.push(p);
      },
      addRoute() {
        this.queueTmp.route.push({
          point: []
        });
      },
      removeRota(index) {
        this.queueTmp.route.splice(index, 1)
      },
      copy() {
        var copyText = document.getElementById('hata');
        copyText.select();
        copyText.setSelectionRange(0, 99999)
        document.execCommand("copy");
      },
      makeUrl(obj) {
        if (this.sa.length > 0) {
          let search = obj.workOpportunityFilterSet;
          let keys = Object.keys(search);
          let text = 'https://relay.amazon.com/api/tours/loadboard?resultSize=200&sortOrder=desc&sortByField=startTime';
          for (let i = 0; i < keys.length; i++) {
            let element = keys[i];
            let type = typeof (search[element]);

            switch (type) {
              case 'number':
                text = text + '&' + element + '=' + search[element]
                break;
              case 'string':
                text = text + '&' + element + '=' + search[element]
                break;
              case 'object':
                if (search[element]) {
                  text = text + '&' + element + '=' + search[element].join(',')

                }
                break;
              default:
                break;
            }
          }
          return text
        }

      }
    }

  })