/**********************************************
 * CONFIDENTIAL AND PROPRIETARY
 *
 * The information contained herein is the confidential and the exclusive property of
 * ZIH Corp. This document, and the information contained herein, shall not be copied, reproduced, published,
 * displayed or distributed, in whole or in part, in any medium, by any means, for any purpose without the express
 * written consent of ZIH Corp.
 *
 * Copyright ZIH Corp. 2012
 *
 * ALL RIGHTS RESERVED
 ***********************************************/

@protocol ResponseValidator

/**
* Provide a method to determine whether a response from the printer is a complete response.
*
* @param input string to be validated
* @return true if the string is a complete response
*/

-(BOOL)isResponseComplete:(NSData *)data;

@end
