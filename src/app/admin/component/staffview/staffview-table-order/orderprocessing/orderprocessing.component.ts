import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TableService } from '../../../../../service/tableService/table.service';
import { WebsocketService } from '../../../../../service/websocketService/websocket.service';
import { OrderdetailService } from '../../../../../service/orderdetailService/orderdetail.service';
import { OrderDetailResponse } from '../../../../../entity/response/orderdetail-response';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../../../service/orderService/order.service';
import { OrderResponse } from '../../../../../entity/response/order-response';
import { Console, error } from 'console';
import { tableResponse } from '../../../../../entity/response/table-response';
import { FoodService } from '../../../../../service/foodService/food.service';
import { foodResponse } from '../../../../../entity/response/food-response';
import e from 'express';
import { CategoryService } from '../../../../../service/categoryService';
import { CategoryResponse } from '../../../../../entity/response/category-response';
import { PaymentService } from '../../../../../service/paymentService/Payment.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceService } from '../../../../../service/paymentService/Invoice.service';
import { invoiceRespone } from '../../../../../interface/invoice/invoice';
import { foodRequest } from '../../../../../entity/request/food-request';
import { OrderRequest } from '../../../../../entity/request/order-request';
import { IpServiceService } from '../../../../../service/ipService/ip-service.service';
import { AreaService } from '../../../../../service/areaService/area.service';
import { AreaResponse } from '../../../../../entity/response/area-response';
import { RequestOrder } from '../../../../../service/requestOrder.service';
import { ApiConfigService } from '../../../../../service/ApiConfigService';

@Component({
  selector: 'app-orderprocessing',
  templateUrl: './orderprocessing.component.html',
  styleUrl: './orderprocessing.component.css',
})
export class OrderprocessingComponent implements OnInit {
  
  listOrderDetails: OrderDetailResponse[] = [];
  listProducts: foodResponse[] = [];
  listCategories: CategoryResponse[] = [];
  itemTable?: tableResponse;
  order?: OrderResponse;
  itemOrderdetail!: OrderDetailResponse;

  //biến lưu trữ các sản phẩm tạm thời
  tempProducts: OrderDetailResponse[] = [];
  itemOrder: OrderRequest[] = [];
  iOrder!: OrderRequest;
  activeCategoryId: number | null = null;
  tempTotal!: number
//Gộp/Tách bàn

selectedTable: tableResponse | null = null;
listOrderDetailsTableMerge: OrderDetailResponse[] = []
selectedTableId: number | null = null;
mergerOrderId: number | null = null;
listArea : AreaResponse[]=[];
listTable :tableResponse[]=[];
tableMergerId !:number;
indexOrder !:number;
selectedAreaId: number=0;
seletedListFood:OrderRequest[]=[];
seletedListUpdateFood:OrderRequest[]=[];
seletedListMergerFood:OrderRequest[]=[];
listFoodRequest:foodRequest[]=[];
quantity:number=0;
test!: any;
  //lưu trữ idOrder cũ
  oldIdOrders: Map<number, number | null> = new Map();
  cancelReason: string = '';
  itemOrderDetailToCancel: number | null = null;

  srcImage = "./img/noImage.jpg";
  hostingImg = ApiConfigService.apiUrlimg;

refreshListMerge(){
  this.seletedListMergerFood=[];
  this.listOrderDetailsTableMerge=[];
  this.seletedListFood=[];
  this.seletedListUpdateFood=[];
  this.listFoodRequest=[];
}

  
  //lưu trữ item orderdetail
  selectedOrderDetail?: OrderDetailResponse;
  constructor(
    private tableservice: TableService,
    private snackBar: MatSnackBar,
    private routerActive: ActivatedRoute,
    private orderdetailsService: OrderdetailService,
    private orderService: OrderService,
    private productService: FoodService,
    private categoryService: CategoryService,
    private webSocketService: WebsocketService,
    private router: Router,
    private ipService: IpServiceService,
    private areaService: AreaService,
    private requestOrder: RequestOrder,  
    private paymentService : PaymentService,
    private invoiceService : InvoiceService,
    private route : ActivatedRoute,
    private apiConfigService : ApiConfigService
  ) { }

  ngOnInit(): void {
    this.getDataOrderdetail();
    this.getAllProducts();
    this.getAllCategories();
    this.notificationOrder();
    this.updateTotal();
    this.route.queryParams.subscribe((params) => {
      if (params['reload']) {
    this.getDataOrderdetail();
    this.getAllProducts();
    this.getAllCategories();
    this.notificationOrder();
    this.updateTotal();
    this.refreshListMerge();
      }
    });
    this.notifiConfirmOrder()
  }

  getOrder(idOrder: number) {
    this.orderService.getOrder(idOrder).subscribe((data) => {
      console.log('Data order: wwww', data.result);
      this.order = data.result;

      console.log('status: ' + this.order?.statusOrder);
    });
  }

  checkStatusOrder(idTable: number) {
    console.log('Status: ', this.order?.statusOrder);
    if (
      this.order?.statusOrder === 'Completed' ||
      this.order?.statusOrder === 'Cancelled'
    ) {
      this.tableservice.updateTableStatus(idTable, 'AVAILABLE').subscribe(
        (data) => {
        },
        (error) => {
          console.log('Error', error);
        }
      );
    } else {
      console.log('lllllll');
    }
  }

  getDataOrderdetail() {
    this.routerActive.params.subscribe((param) => {
      let idOrder = param['idOrder'];
      let idTable = param['idTable'];
      console.log(idOrder);
      console.log(idTable);
      if (idOrder != undefined) {
        this.getOrder(idOrder);
        this.orderdetailsService
          .getOrderDetail(idOrder, idTable)
          .subscribe((data) => {
            this.listOrderDetails = data.result;
          });
      } else {
        this.tableservice.getTable(idTable).subscribe((data) => {
          this.itemTable = data.result;
        });
      }
    });
  }


 

  confirmOrder(idOrder: number | null) {
    this.orderService.confirmOrder(idOrder).subscribe(
      (data) => {
        console.log('data',data)
        this.openTotast('✅ Đã xác nhận | ' + this.order?.nameTable);
        console.log('confirm')
        this.router.navigate(['/admin/staff/tableorder_staff/orderprocessing', data.result.idOrderMain, this.order?.idTable]);
      },
      (error) => {
        console.log('Error', error);
      }
    );
  }
  


  //Save Order
  saveOrder(idTable: number) {
    this.tempProducts.forEach((product) => {
      this.itemOrder.push(
        new OrderRequest(product.idOrderDetail, product.quantity,product.nameFood,product.noteFood)
      );
    });
    this.orderService.createNewOrder(this.itemOrder, idTable)?.subscribe(
      (data) => {
        const idOrder = data.result.idOrder;
        console.log('Updated Map in saveOrder: ', this.oldIdOrders);
        this.router.navigate([
          `/admin/staff/tableorder_staff/orderprocessing/${idOrder}/${idTable}`,
        ]);
      },
      (error) => {
        console.log('Error', error);
        alert(this.errorCode[error.error.code])
      }
    );
  }

  notificationOrder() {
    this.webSocketService.onMessage().subscribe((message) => {
      if (message) {
        this.getDataOrderdetail();
        console.log('ordermess:' + message);
      }
    });
  }

  notifiConfirmOrder() {
    this.webSocketService.onConfirmMessage().subscribe((message) => {
      if (message) {
        this.getDataOrderdetail();
        console.log('ordermess:' + message);
      }
    });
  }
  // ********************************
  getAllProducts() {
    this.productService.getAllList().subscribe(
      (data) => {
        this.activeCategoryId = null;
        this.listProducts = data.result.content;
        console.log('Data product', data.result.content);
      },
      (err) => {
        console.log('Error', err);
      }
    );
  }

  getAllCategories() {
    this.categoryService.getAllCate().subscribe((data) => {
      console.log('Category: ', data.result);
      this.listCategories = data.result;
    });
  }

  getByIdCategory(idCategory: number) {
    this.productService.getByIdCategory(idCategory).subscribe((data) => {
      this.activeCategoryId = idCategory;
      this.listProducts = data.result;
      console.log('data food by category', data.result);
    });
  }


  // // ********************************************************************************************
  clickProduct(product: foodResponse) {
    console.log('idFood', product.idFood);
    if (this.order) {
      // Nếu đã có order, cập nhật order hiện tại
      let existingProductInList = this.listOrderDetails.find(
        (item) => item.nameFood === product.nameFood
      );

      if (!existingProductInList) {
        // Nếu sản phẩm chưa có trong danh sách, tạo đối tượng mới
        let newOrderDetail: OrderDetailResponse = {
          idOrderDetail: product.idFood,
          nameFood: product.nameFood,
          idFood:product.idFood,
          quantity: 1,
          price: product.priceFood,
          totalPrice: product.priceFood,
          noteFood: '',
          discount: product.discount,
        };
        this.listOrderDetails.push(newOrderDetail);
      }
      this.iOrder = new OrderRequest(product.idFood, 1, product.note,product.nameFood);
      console.log('update', this.listOrderDetails);
      this.updateOrder(this.order.idOrder, this.iOrder);
    } else {
      this.addToTemp(product);
    }
  }

  // Thêm sản phẩm vào danh sách tạm thời
  addToTemp(product: foodResponse) {
    let existingProductInTemp = this.tempProducts.find(
      (item) => item.nameFood === product.nameFood
    );

    if (existingProductInTemp) {
      console.log('quantityProductTemp');
      // Nếu sản phẩm đã tồn tại trong tempProducts, tăng số lượng và cập nhật giá trị tổng
      existingProductInTemp.quantity++;
      existingProductInTemp.totalPrice = existingProductInTemp.price *
        existingProductInTemp.quantity * ((100 - existingProductInTemp.discount) / 100);
    } else {
      // Nếu sản phẩm chưa tồn tại trong tempProducts, thêm sản phẩm mới vào danh sách tạm thời
      let orderDetail: OrderDetailResponse = {
        idOrderDetail: product.idFood,
        nameFood: product.nameFood,
        idFood:product.idFood,
        quantity: 1,
        price: product.priceFood,
        totalPrice: product.priceFood * ((100 - product.discount) / 100),
        noteFood: '',
        discount: product.discount,
      };
      this.tempProducts.push(orderDetail);
    }

    // Cập nhật hoặc thêm sản phẩm vào listOrderDetails
    let existingProductInList = this.listOrderDetails.find(
      (orderDetail) => orderDetail.nameFood === product.nameFood
    );

    if (existingProductInList) {
      // Nếu sản phẩm đã tồn tại trong listOrderDetails, chỉ tăng số lượng của sản phẩm đó
      console.log('quantityproductList');
      existingProductInList.quantity++;
      existingProductInList.totalPrice = existingProductInList.price *
        existingProductInList.quantity * ((100 - existingProductInList.discount) / 100)
    } else {
      // Nếu sản phẩm chưa có trong listOrderDetails, thêm sản phẩm mới
      let newOrderDetail: OrderDetailResponse = {
        idOrderDetail: product.idFood,
        nameFood: product.nameFood,
        idFood:product.idFood,
        quantity: 1,
        price: product.priceFood,
        totalPrice: product.priceFood * ((100 - product.discount) / 100),
        noteFood: '',
        discount: product.discount,
      };
      this.listOrderDetails.push(newOrderDetail);
    }
    this.updateTotal();
  }



  //Update order
  updateOrder(idOrder: number, itemOrder: OrderRequest) {
    if (!itemOrder) return;
    this.orderService.updateOrder(idOrder, itemOrder).subscribe(
      (data) => {
        console.log('Order updated successfully', data);
        this.getDataOrderdetail(); 
      },
      (error) => {
        console.log('Error', error);
      }
    );
  }

  // Cập nhật tổng tiền đơn hàng
  updateTotal() {
    const total = this.listOrderDetails.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    if (this.order) {
      this.order.total = total;
    } else {
      this.tempTotal = total
      console.log()
    }
  }

  updateQuantityTemp(item: OrderDetailResponse, newQuantity: number) {
    if (newQuantity < 1) {
      return;
    }

    let existingProductInTemp = this.tempProducts.find(
      (itemor) => itemor.nameFood === item.nameFood
    );

    if (existingProductInTemp) {
      console.log('quantityProductTemp');
      existingProductInTemp.quantity = newQuantity;
    }

    let existingProductInList = this.listOrderDetails.find(
      (orderDetail) => orderDetail.nameFood === item.nameFood
    );

    if (existingProductInList) {
      // Nếu sản phẩm đã tồn tại trong listOrderDetails, chỉ tăng số lượng của sản phẩm đó
      console.log('quantityproductList');
      existingProductInList.quantity = newQuantity;


    }
    item.totalPrice = item.price * item.quantity * ((100 - item.discount) / 100)
    this.updateTotal();
    console.log('Temppr: ', this.tempProducts)
    console.log('ListOrr: ', this.listOrderDetails)
  }

  //cập nhật số lượng orderdetail
  updateQuantity(idOrder: number, idOrderDetail: number, newQuantity: number) {
    if (newQuantity < 1) {
      return;
    }
    this.orderService
      .updateOrderDetailQuantity(idOrder, idOrderDetail, newQuantity)
      .subscribe(
        (data) => {
          this.getDataOrderdetail();
          console.log('Success update quantity', idOrderDetail);
        },
        (err) => {
          console.log('Error', err);
        }
      );
  }

  onQuantityChange(idOrder: number, idOrderDetail: number, event: any) {
    const newQuantity = parseInt(event.target.value, 10)
    const orderDetail = this.listOrderDetails.find(
      (item) => item.idOrderDetail === idOrderDetail
    );
    if (!orderDetail) {
      return;
    }
    if (isNaN(newQuantity) || newQuantity < 1) {
      event.target.value = orderDetail.quantity;
      return;
    }
    this.updateQuantity(idOrder, idOrderDetail, newQuantity);
  }
  
  

  removeOrderDetails(idOrderDetail: number) {
    if (this.order) {
      if (this.listOrderDetails.length === 1) {
        // Hiển thị modal yêu cầu nhập lý do hủy
        this.showCancelModal(idOrderDetail);
      } else {
        // Xóa phần tử nếu không phải phần tử cuối
        this.executeRemove(idOrderDetail);
      }
    } else {
      this.listOrderDetails = this.listOrderDetails.filter(
        (orderDetail) => orderDetail.idOrderDetail !== idOrderDetail
      );
      this.tempProducts = this.tempProducts.filter(
        (tempProduct) => tempProduct.idOrderDetail !== idOrderDetail
      );
      this.updateTotal();
    }
  }

  selectOrderDetail(item: OrderDetailResponse) {
    this.selectedOrderDetail = item; // Lưu sản phẩm chi tiết được chọn
  }


  showCancelModal(idOrderDetail: number) {
    const modalElement = document.getElementById('cancelModal');
    if (modalElement) {
      modalElement.style.display = 'block';
    }
    this.itemOrderDetailToCancel = idOrderDetail;
  }

  cancelModalClose() {
    const modalElement = document.getElementById('cancelModal');
    if (modalElement) {
      modalElement.style.display = 'none';
    }
  }

  confirmCancel() {
    if (this.itemOrderDetailToCancel) {
          this.executeRemove(this.itemOrderDetailToCancel!);
        }
    this.cancelModalClose();
  }


  executeRemove(idOrderDetail: number) {
    this.orderService.removeOrderDetail(idOrderDetail).subscribe(
      (data) => {
        this.getDataOrderdetail();
          setTimeout(() => {
            if (this.listOrderDetails.length === 0) {
              this.routerActive.params.subscribe((param) => {
                let idTable = param['idTable'];
                this.router.navigate([
                  `/admin/staff/tableorder_staff/orderprocessing/${idTable}`,
                ]);
              });
            }
          }, 100);
      },
      (err) => {
        console.log('Delete fail!', err);
      }
    );
  }



  openModalCancel() {
    const modalElement = document.getElementById('cancelModal');
    if (modalElement) {
      modalElement.style.display = 'block';
    }
  }

  handleCancelAction() {
    if (this.cancelReason.trim() !== '') {
      if (this.itemOrderDetailToCancel) {
        this.executeRemove(this.itemOrderDetailToCancel);
      } else {
          this.orderService.cancelOrder( this.order!.idOrder, this.cancelReason).subscribe(
            (res) => {
              console.log(res);
              if(res.result.idOrderMain === null){
                this.router.navigate(['/admin/staff/tableorder_staff/tableorder'])
                this.openTotast('⚠️ Đã hủy đơn #'+this.order?.idOrder+' | '+this.order?.nameTable)
              }else{
                this.router.navigate(['/admin/staff/tableorder_staff/orderprocessing', this.order?.idOrderMain, this.order!.idTable])
                this.openTotast('⚠️ Đã hủy gộp đơn')
              }
            },
            (error) => {
              console.log('Error', error);
            }
          );
        
      }

    }
    this.cancelReason = ''; 
    this.cancelModalClose();
  }
  // Lấy danh sách khu vực cho bàn mới
  getAllArea(){
    this.areaService.getAllAreas().subscribe(data =>{
     this.listArea=data.result
    }, error => {
     console.log('Error', error)
   }
    )
   }
 
   updateQuantityOrder(index: number,event:Event,id: number, ) {
    let target = event.currentTarget as HTMLInputElement
    if(target.valueAsNumber){
      this.quantity = target.valueAsNumber ;
    }else{
      this.quantity = 0
    }
    
    this.moveToNewTable(id,index)
    
  }
  
  moveToNewTable(id: number, index: number): void {
    
  
      const food = this.listOrderDetails.find(item => item.idFood === id);
    if (food) {

        if (this.quantity <= 0) {
            this.openTotast("Số lượng phải là số dương.");
            return;
        }

        if ( this.quantity>food.quantity ) {
            this.openTotast("Số lượng chuyển không được lớn hơn số lượng hiện có ở bàn cũ.");
            return;
        }
   
        const existingItem = this.seletedListFood.find(item => item.idFood === id);

       
        if (existingItem) {
          
            existingItem.quantity += this.quantity;
        } else {
           
              const orderRequest: OrderRequest = {
              idFood: food.idFood,
              quantity: this.quantity,
              noteFood: food.noteFood,
              nameFood: food.nameFood,
              
            };    
           

          
            this.seletedListFood.push(orderRequest);
        }

        const currentFood = this.listOrderDetails.find(item => item.idFood === id);
        if (currentFood) {
            currentFood.quantity -= this.quantity;

            if (currentFood.quantity < 0) {
                currentFood.quantity = 0;
                this.openTotast("Số lượng bàn cũ không đủ");
            }
          if (this.listOrderDetails[index].quantity === 0) {
         
          this.listOrderDetails.splice(index, 1);
          this.updateTotal();
        }
            
            const orderRequestOld: OrderRequest = {
              idFood: food.idFood,
              quantity: food.quantity,
              noteFood: food.noteFood,
              nameFood: food.nameFood,
              
            };
            console.log(orderRequestOld.quantity)
            this.seletedListUpdateFood.push(orderRequestOld);
            console.log( this.seletedListUpdateFood)
        }
    }
    
    
   
}
removeFromNewTable(index: number): void {
  const removedItem = this.seletedListFood[index];
  this.seletedListFood.splice(index, 1);
  const existingItem = this.listOrderDetails.find(item => item.idFood === removedItem.idFood);

  if (existingItem) {
      existingItem.quantity += removedItem.quantity;
      
  } else {
      this.listOrderDetails.push({
          idOrderDetail: 0, 
          idFood: removedItem.idFood,
          quantity: removedItem.quantity,
          price: 0, 
          totalPrice: 0, 
          noteFood: removedItem.noteFood || "",
          nameFood: removedItem.nameFood,
          discount: 0, 
      });
  }
}

createNewOrder(): void {
  if (this.selectedTableId) {
    this.requestOrder.postNewOrder(this.seletedListFood, this.selectedTableId)
      .subscribe(
        response => {
          console.log('New order created:', response);
          this.openTotast('Đã tách bàn thành công!');
          this.seletedListFood = [];
          this.selectedTableId = null;

          this.routerActive.params.subscribe(param => {
            let idOrder = param['idOrder'];
            let idTable = param['idTable']
            if (idOrder) {
              if (this.listOrderDetails.length === 0) {
                // Xóa đơn hàng cũ nếu danh sách món ăn rỗng
                this.requestOrder.deleteOrder(idOrder)
                  .subscribe(
                    () => {
                   
                      console.log('Order deleted successfully');
                    },
                    (error) => {
                      console.error('Error deleting order:', error);
                    }
                  );
                
              } else {
                if (idOrder) {

                  this.requestOrder.updateOrderAll(idOrder, this.seletedListUpdateFood)
                    .subscribe(
                      response => {
                     this.ngOnInit();
                        console.log('Order updated successfully:', response);
                        console.log('Đơn hàng cũ đã được cập nhật thành công!');
                        console.log(this.seletedListUpdateFood)
                      },
                
                      error => {
                        
                        console.error('Error updating order:', error);
                        }
                        
                    );
                 
              }
              }
            }
      
          });
        },
        error => {
          console.error('Error creating new order:', error);
          this.openTotast('Lỗi khi tạo đơn hàng.');
        }
      );
     
  } else {
    this.openTotast('Vui lòng chọn bàn mới.');
  }
}
onTableSelectChange(mergerOrder: tableResponse | null): void  {
 
  if (mergerOrder) {
    
    const currentOrderId = mergerOrder.currentOrderId;
    const  idTable = mergerOrder.idTable;
    this.tableMergerId = idTable;
    this.mergerOrderId = currentOrderId;
     alert(mergerOrder)
    
    console.log('Selected currentOrderId:', currentOrderId);
    console.log('Selected idTable:', idTable);
    
    
    this.orderdetailsService.getOrderDetail(currentOrderId, idTable).subscribe(data => {
      console.log('DataOrderget: ', data.result)
      this.listOrderDetailsTableMerge = data.result
    })

  } else {
 
  } 
}
mergeOrder() {
  this.routerActive.params.subscribe(param => {
    let idTable = param['idTable'];
    let idOrder = param['idOrder'];
    if(idTable == this.tableMergerId ){
      this.openTotast('Không thể gộp cùng 1 bàn lại với nhau.')
    }else{
      for (const element of this.listOrderDetailsTableMerge) {
        const existingItem = this.listOrderDetails.find(item => item.idFood === element.idFood);
        let orderRequestOld: OrderRequest;
    
        if (existingItem) {
          orderRequestOld = {
            idFood: element.idFood,
            quantity: element.quantity + existingItem.quantity,
            noteFood: element.noteFood,
            nameFood: element.nameFood,
          };
        } else {
    
          orderRequestOld = {
            idFood: element.idFood,
            quantity: element.quantity,
            noteFood: element.noteFood,
            nameFood: element.nameFood,
          };
        }
        this.seletedListMergerFood.push(orderRequestOld);
      }
      
      
      for (const element of this.listOrderDetailsTableMerge) {
        const existingItem = this.listOrderDetails.find(item => item.idFood === element.idFood);
    
        if (existingItem) {
    
          existingItem.quantity += element.quantity;
          
        } else {
          this.listOrderDetails.push({
            idOrderDetail: 0, 
            idFood: element.idFood,
            quantity: element.quantity,
            price: element.price, 
            totalPrice: element.price*element.quantity * (100 - element.discount) / 100, 
            noteFood: element.noteFood || "",
            nameFood: element.nameFood,
            discount: element.discount, 
        });
        }
      }
      
    
        if (idOrder) {
          this.requestOrder.updateOrderAll(idOrder, this.seletedListMergerFood)
            .subscribe(
              response => {
                this.ngOnInit();
                console.log('Order updated successfully:', response)
                const orderId = Number(this.mergerOrderId);
               console.log("idOrder",orderId)
               this.getOrder(idOrder)
               this.updateTotal()
                this.requestOrder.deleteOrder(orderId).subscribe(
                  () => {

                    console.log('Order deleted successfully');
                  },
                  (error) => {
                    console.error('Error deleting order:', error);
                  }
                );
                
                this.openTotast('Gộp bàn thành công!');
               
              },
              error => {
                console.error('Error updating order:', error);
                this.openTotast('Lỗi khi Gộp bàn.');
              }
            );
        }
      
    
      this.listOrderDetailsTableMerge = [];
    }

  });
}
getTable() {
  console.log("areaid",this.selectedAreaId)
  this.tableservice.getTablesByArea("", this.selectedAreaId, "AVAILABLE", 0, 1000)
    .subscribe(data => {
      this.listTable = data.result.content;
      console.log("Table", this.listTable);
    });
}
getTableOpen() {
  console.log("areaid",this.selectedAreaId)
  this.tableservice.getTablesByArea("", this.selectedAreaId, "OCCUPIED", 0, 1000)
    .subscribe(data => {
      this.listTable = data.result.content;
      console.log("Table", this.listTable);
    });
}

openTotast(status: string) {
  this.snackBar.open
    (status, "Đóng", {
      duration: 4000,
      horizontalPosition: 'end', //  'start', 'end'
      verticalPosition: 'bottom', //  'bottom'
    })
}



  formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
  }



  paymentPaythod = "cash"

  errorCode: Record<number, string> =
    { 1601: "Đơn hàng đã được hoàn thành trước đó !" ,
      1901: "Không có ca nào đang làm việc !" 
    }

  listDataInvoice  !: invoiceRespone[];

  paymentOrder() {
    if (this.paymentPaythod == "ewallet") {
      if (this.order) {
        this.paymentService.postRequestPaymentVNPay(this.order.idOrder).subscribe(
          data => {
            console.log(data);
            // window.location.assign(data.result.urlToRedirect)
            window.open(data.result.urlToRedirect)
            this.router.navigateByUrl("/admin/staff/tableorder_staff/tableorder")
          }, error => {
            alert(this.errorCode[error.error.code])
            console.log(error);

          }

        );
      }
    } else {
      if (this.order) {
        this.paymentService.postRequestPaymentManual(this.order.idOrder).subscribe(
          data => {
            console.log(data);
            // window.location.assign(data.result.urlToRedirect)
            this.openTotast('✅ '+this.order?.nameTable+' | Thanh toán thành công!')
            this.router.navigateByUrl("/admin/staff/tableorder_staff/tableorder")
          }, error => {
            alert(this.errorCode[error.error.code])
            console.log(error);

          }

        );
      }
    }
  }

  getInvoice() {
    if (this.order)
      this.invoiceService.getInvoiceByIdOrder(this.order.idOrder).subscribe(
        data => {
          this.listDataInvoice = data.result
          console.log(this.listDataInvoice);
          console.log("alo");

        }, error => {
          console.log(error)
        }
      )
  }


  downloadPdf() {
    const data = document.getElementById('body_invoice');

    if (data) {
      html2canvas(data).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();

        // Tính toán kích thước PDF dựa trên kích thước hình ảnh
        const imgWidth = 200;
        const pageHeight = pdf.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Thêm trang mới nếu cần thiết
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Lưu PDF và mở hộp thoại in
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Mở PDF trong tab mới
        const pdfWindow = window.open(pdfUrl);
        if (pdfWindow) {
          pdfWindow.onload = function () {
            pdfWindow.print();
          };
        }

      });
    } else {
      console.error("Không tìm thấy div với ID 'body_invoice'");
    }
  }

  reloadData() {
    console.log(this.router.url); 
    this.router.navigateByUrl(this.router.url+'/reload=1')

  

  }

}

