FINAL YEAR PROJECT
E-Masjid System











GOVT. GRADUATE COLLEGE, CIVIL LINES,
SHEIKHUPURA

Supervisor: Sir Muhammad Kamran

Submitted By:
Dawood Ahmed	2022-KS-158 | 2022-089264
Haris Ehsan	2022-KS-190 | 2022-089301

Session: 2022-2026

Project ID: 22-KS-BSIT-15
Bachelor of Science in Information Technology


FINAL YEAR PROJECT REPORT
E-Masjid System




A project Presented to
Faculty of Computing and Information Technology (FCIT)
University of the Punjab
Lahore



In partial fulfillment of the requirement for the degree of
Bachelor of Science in Information Technology
Session (2022-2026)



Submitted By:
Dawood Ahmed	2022-KS-158 | 2022-089264
Haris Ehsan	2022-KS-190 | 2022-089301





DECLARATION
The work reported in this project was carried out by us under the supervision of our project supervisor, Sir Muhammad Kamran, at Government Graduate College, Civil Lines, Sheikhupura. 
We affirm that this project, along with its contents, is the result of our independent research efforts. No portion of this work has been directly copied from any previously written or published material, except for referenced sources, standard mathematical or scientific models, equations, formulas, protocols, etc. Furthermore, we confirm that this work has not been presented for the attainment of any other academic degree or diploma. 
The university may take appropriate action if the provided information is found to be inaccurate at any stage.


Student Name	Registration No.	Signature
Dawood Ahmed	2022-KS-158 | 2022-089264	

Haris Ehsan	2022-KS-190 | 2022-089301	



 
STATEMENT OF SUBMISSION
This is to certify that the following students have worked on their final year project, titled E-Masjid System, at Government Graduate College, Civil Lines, Sheikhupura, as part of the partial requirements for the degree of Bachelor of Sciences in Information Technology.

Serial No.	Registration No.	Roll No.	Student Name
1	2022-KS-158	089264	Dawood Ahmed
2	2022-KS-190	089301	Haris Ehsan





Head of Department
Muhammad Ali Waqas
Associate Professor of Computer Science
Govt. Graduate College,
Civil Lines, Sheikhupura	Supervisor 
Muhammad Kamran
Lecturer in Computer Science
Govt. Graduate College,
Civil Lines, Sheikhupura





Project Coordinator
Hasan Raza 
Lecturer in Computer Science
Govt. Graduate College,
Civil Lines, Sheikhupura




PROOFREADING CERTIFICATE
This is to certify that Dawood Ahmed (Roll#089264) and Haris Ehsan (Roll#089301) have prepared documentation for their final year project (FYP) titled E-Masjid System at the Department of Computer Science, Government Graduate College, Civil Lines, Sheikhupura, in partial fulfillment of the requirements for the degree of Bachelor of Sciences in Information Technology.


















Project Supervisor
Muhammad Kamran 
Lecturer in Computer Science
Govt. Graduate College,
Civil Lines, Sheikhupura



Acknowledgement
We would like to express our sincere thanks to Sir Muhammad Kamran, Lecturer at Government Graduate College, Civil Lines, Sheikhupura, for his valuable guidance, encouragement and support during the preparation of our project documentation.
We are also thankful to our friends and families for their quiet support and motivation, which helped us stay focused throughout this phase of our work.

Date: January 27, 2026

 
PROJECT INFORMATION

Project Title	E-Masjid System
Objective	To build a management system for mosque
Undertaken by	Dawood Ahmed and Haris Ehsan
Supervised by	Sir Muhammad Kamran
Starting Date	02/10/25
Completion Date 	30/06/26 (Expected)
Tools Used	Visual Studio Code , MS Word, Draw.io
Technologies	React.JS, Node.JS, Express.JS, MongoDB, Stripe API

 
PREFACE
This is a final year project (FYP) report written by students of Bachelor of Science in Information Technology at the University of the Punjab. We are Dawood Ahmed and Haris Ehsan, both of us are studying in BSIT (Hons) at Government Graduate College, Civil Lines, Sheikhupura.
To enable you to understand the idea of our project and the implementation process in detail and systematically, this report is divided into topics; each topic with a specific focus. We hope this approach allows you to read and understand our project report easily. Lastly, if you have any comments, you are welcome to contact us at:

Member 1:	Dawood Ahmed	dawood.bhatti8812@gmail.com

Member 2:	Haris Ehsan	harisehsan43@gmail.com

 
E-Masjid System

Executive Summary

The E-Masjid System is a web based system and is built to help mosques to manage their daily activities in a digital way. In many places, mosques are still using manual registers for the records of donations and expenses and announcements are made only through loudspeakers which reach people within a limited area. This creates problems like lack of transparency, difficulties in keeping records, inconvenience for people who want to donate online. Also people have to visit the mosque physically to meet the religious scholar and tell the date of the nikah ceremony. We are building this project in order to fix these problems by developing an online system which will be easy to use. The system allows the mosque admin to control the times of prayers, post announcements and also maintain proper records of donations and expenses. Community members are able to donate online through Stripe, view updates from the mosque, register for events and book Nikah services without physically visiting the mosque. The system is designed to be simple and user friendly for all technical and  not technical users.  
FYDP Overview
FYDP Title : E-Masjid System
___________________________________________________
Sr. No	Roll Numbers	Name	Signatures 
1.	089264	Dawood Ahmed	
2.	089301	Haris Ehsan	
Table 1 Project Proposal Summary
FYDP Goals
                       To make digital platform for mosque management that make operations easy, give   
transparency in donations and make services accessible for community.  
FYDP Objectives
Display and manage prayer timings  
People can donate online 
Create transparent donation tracking system  
Organize events and programs in the community  
Enable online Nikah service booking  
Perform secure user role management  
FYDP Success Criteria
This system will be considered as successful if,
People can make online donations through stripe
It shows records of donations.  
It shows records of expenditures  
Admin can organize events using the system  
People can book nikah registrar using the system  
Assumptions:
Mosque will use system  
People have internet  
Risks & Obstacles 
Traditional people may resist new system  
People face difficulty with technology  
Internet problems   
Organization Address: Government Graduate College Civil lines Sheikhupura  
Target End Users Mosque administrators, committee members, community members, donors, families needing nikah registrar services  
Suggested Project Supervisor: Muhammad Kamran  
Approved By: Muhammad Kamran  
Date: October 24, 2025

 

Table of Contents
E-Masjid System	9
Executive Summary	9
FYDP Overview	10
Chapter No 1	16
Project Proposal	16
1.1.	Introduction	17
1.2.	Background	17
1.3.	Problem Statement	17
1.4.	Stakeholders & Interests	17
1.5.	Objectives:	18
1.6.	Scope:	18
In-scope	18
Out-of-scope	19
1.7.	Assumptions	19
1.8.	Risks	19
1.9.	Success Criteria	20
1.10.	Tools, Libraries & Technologies	20
1.11.	Work Division	21
1.12.	Conclusion	21
Chapter No 2	22
Literature Review	22
2.1	Literature Survey	23
2.2	Related Work:	23
2.3	Gap Analysis:	23
2.4	Summary	23
Chapter No 3	24
Software Requirements Specification	24
3.1	Requirements Analysis	25
3.2	User classes and characteristics	25
3.3	Requirement Identifying Technique	25
3.4	Functional Requirements	26
Functional Requirement 1	26
Functional Requirement 2	26
Functional Requirement 3	27
Functional Requirement 4	27
Functional Requirement 5	28
Functional Requirement 6	29
Functional Requirement 7	29
Functional Requirement 8	30
Functional Requirement 9	30
Functional Requirement 10	31
Functional Requirement 11	31
3.5	Non-Functional Requirements	32
1.	Reliability	32
2.	Usability	32
3.	Performance	33
4.	Security	33
3.6	External Interface Requirements	33
1.	User Interfaces Requirements	33
2.	Software Interfaces	34
3.	Hardware Interfaces	34
4.	Communications Interfaces	34
3.7	Use case Analysis	35
Community User Use Cases	35
Use Case #1 – Register User	35
Use Case #2 – Login User	35
Use Case #3 – Forgot Password	36
Use Case #4 – View Prayer Times	36
Use Case #5 – View Events & Register	37
Use Case #6 – View Donation Records	37
Use Case #7 – View Announcements	38
Use Case #8 – Make Donation	38
Use Case #9 – Book Nikah Services	39
Use Case #10 – View Booking Status	40
Admin Use Cases	40
Use Case #11 – Admin Login	40
Use Case #12 – Manage Donations & Expenses	41
Use Case #13 – Manage Prayer Times	41
Use Case #14 – Manage Events	42
Use Case #15 – Manage Announcements	42
Use Case #16 – Manage Religious Scholar Account	43
Religious Scholar Use Case	43
Use Case #17 – Check Nikah Requests	43
Use Case Diagram	44
3.8	Storyboards	46
Storyboard 1 – Online Donation System	46
Storyboard 2 – Event Management	47
Storyboard 3 – Nikah Booking	47
3.9	Summary	48
Chapter No 4	49
Software Design Specification	49
4.1	System Design	50
4.2	Design Considerations	51
Assumptions	51
Dependencies	51
Limitations	51
Risks	51
4.3	Requirements Traceability Matrix	52
4.4	Design Models	53
1.	Design Class Diagram	53
2.	Sequence Diagram	53
3.	State Transition Diagram	56
4.5	Architectural Design	59
1.	UML Component diagram	60
4.6	Data Design	60
1.	Data Dictionary	61
4.7	User Interface Design	64
1.	Screen Images	65
2.	Screen Objects and Actions	69
4.8	Design Decisions	70
4.9	Summary	70
References	71
1.	World Wide Web	72

List of Tables

Table 1 Project Proposal Summary	10
Table 2 Project Success Criteria	20
Table 3 Tools Technologies and Libraries	20
Table 4 Project Team Members Work Division	21
Table 5 User classes	25
Table 6 Functional Requirement 1	26
Table 7 Functional Requirement 2	26
Table 8 Functional Requirement 3	27
Table 9 Functional Requirement 4	27
Table 10 Functional Requirement 5	28
Table 11 Functional Requirement 6	29
Table 12 Functional Requirement 7	29
Table 13 Functional Requirement 8	30
Table 14 Functional Requirement 9	30
Table 15 Functional Requirement 10	31
Table 16 Functional Requirement 11	31
Table 17 Use Case 1	35
Table 18 Use Case 2	35
Table 19 Use Case 3	36
Table 20 Use Case 4	36
Table 21 Use Case 5	37
Table 22 Use Case 6	37
Table 23 Use Case 7	38
Table 24 Use Case 8	38
Table 25 Use Case 9	39
Table 26 Use Case 10	40
Table 27 Use Case 11	40
Table 28 Use Case 12	41
Table 29 Use Case 13	41
Table 30 Use Case 14	42
Table 31 Use Case 15	42
Table 32 Use Case 16	43
Table 33 Use Case 17	43
Table 34  Requirements Traceability Matrix	52
Table 35 Data Dictionary Table	61






Tables of Figures

Figure 1 Use Case diagram of Community members	44
Figure 2 Use Case diagram of Mosque Admin	45
Figure 3 Use Case diagram of Religious Scholar	45
Figure 4 Online Donation Storyboard	46
Figure 5 Event Management Storyboard	47
Figure 6 Nikah booking Storyboard	47
Figure 7 Class diagram	53
Figure 8 Login Sequence Diagram	54
Figure 9 Online Donation Sequence Diagram	54
Figure 10 Nikah Booking Sequence Diagram	55
Figure 11 Admin Update Prayer Times Sequence Diagram	55
Figure 12 User Account State Diagram	56
Figure 13 Nikah Booking Status State Diagram	57
Figure 14 Event State Diagram	58
Figure 15  High-Level System Architecture	59
Figure 16 Component diagram	60
Figure 17 Home page design	65
Figure 18 Login page design	66
Figure 19 Donation Transparency page design	67
Figure 20 Admin Dashboard design	68
Figure 21 Scholar page design	68
  
Chapter No 1
Project Proposal 
1.1.	Introduction
This chapter is an introduction about our Final Year Project E-Masjid System. We explain the reason why we chose this project and what problems will be solved. We also list the tools that we will be using and how our team members will be working together on this project. This chapter gives the complete overview of our project idea.
1.2.	Background
In our country, mosques are the place where parent send their children to get Islamic teaching related to our religion. Person of any age can come to mosque and ask questions for which they have doubt in their mind so the person get the answers according to the Islam. Every town has one or more mosques that handles prayer schedule, organize religious events and collect donations. These days mosques manage their records in registers which become messy and can be destroyed by various causes. Also it is very time taking process to find the records on urgent bases. So there is a need of digital system where the records will be easily accessible and management of operations become easy.  
1.3.	Problem Statement
People who donate to the mosque do not know where their donations are used and how they are used. When families need nikah service, they have to visit physically to get nikah registrar. People who are away from their area mosque do not get the updates what announcement and events are going to happen. Another big problem is using paper registers for keeping records. This method is slow and if register get lost or damaged, all important information is gone forever.
1.4.	Stakeholders & Interests

Stakeholder  	Description  	Interest  
Mosque  
Administration  	People who manage mosque operations like imam and committee members  	Good management of operations and transparent record keeping  
Donors  	Community people who give money to mosque for different causes  	Send their donations and see how funds are being used  
Community 
Members  	Local people who regularly visit mosque for prayers and activities  	View prayer times, announcements, and events, register for events, request services easily.  
Religious 
Scholars  	Qualified Islamic scholars who perform nikah ceremonies and religious duties  	Manage availability for Nikah, share special prayer timings, avoid double booking.  

1.5.	Objectives: 
1	To make a web based system for mosque management using MERN stack.  
2	To manage donations in a clear way and record of where money is spent. Also people  can donate online.  
3	To show daily prayer times and special timings for Jummah and Ramadan.  
4	To make an event section for Islamic classes, charity and other community programs.  
5	To create an online system for booking nikah registrar for nikah.  
6	To give different access to admin, religious scholar and normal users for security and  management.
1.6.	Scope: 
In-scope  
1.	Digital management of prayer times and announcements.  
2.	Transparent tracking and record keeping of donations.
3.	Create an event and registration system.  
4.	Online booking system for Nikah services.  
5.	User authentication for admin, religious scholar and community members.  
6.	Single mosque management system.  
7.	Responsive web design for mobile and desktop.
8.	Online payment gateway integration.    
Out-of-scope  
1.	Multi mosque system
2.	Automated SMS or email notification system  
1.7.	Assumptions
Following are the assumptions of our system:
1.	Mosque management know basic computer operations like using a browser and typing.
2.	Users have internet connection and email addresses.
3.	The mosque has at least one computer or laptop for the admin to use.
4.	Religious scholars can use simple websites and click buttons.
5.	Community members can use web browsers on their phones or computers.
6.	People will use the system honestly and enter correct information.
1.8.	Risks
Following are the risks that can occur in the development of our project:
1.	Payment security issues: Someone may attempt to steal payment information.
Mitigation: We will use Stripe payment gateway which is very secure and helps to follow international security standards.
2.	System downtime during prayer times: If system stops working when people need to check prayer times
Mitigation: We will use a reliable hosting service and will maintain backup of data. 
3.	Elderly users finding system difficult: Old people might not understand how to use website.
Mitigation: We are going to design simple interface with big buttons and text to be clear. 
4.	Data loss due to system crash: If database gets damaged, all the records can be lost.
Mitigation: We will setup automatic weekly backup of database to cloud storage.

1.9.	Success Criteria
For the success of our system , the following features must work properly:
Table 2 Project Success Criteria
User Registration and Login of admin , religious scholar and community members.
Donation recording and tracking system.
Prayer times management and display.
Event creation and registration.
Nikah booking system.
Financial reports showing income and expenses.
Responsive design to work on mobile phones.
Safe payment processing using Stripe.
Admin Dashboard to manage all the operations.
Simple and easy to use interface.
Data back up .
System deployment on live server.

1.10.	Tools, Libraries & Technologies
Table 3 Tools Technologies and Libraries



Tools, Libraries, 
And
Technologies	Tools	Version	Rationale
	VS Code ,
MS Word, Draw.io	Latest  	code editor with good features 
	Libraries	Version	Rationale
	React.js ,  Express.js  
  
 JWT , Mongoose    
	Latest  	For building responsive design and creating APIs and handling server side logic.  
	Technology	Version	Rationale
	React , Nodejs ,  JS ,
Mongo DB, Stripe API	Latest  	To build a complete web app  

 
1.11.	Work Division 

Table 4 Project Team Members Work Division
Sr. No	Roll Number	Name	Role Assignment & Work Division
1.	089264	Dawood Ahmed	Backend
2.	089301	Haris Ehsan	Frontend

1.12.	Conclusion
In this chapter, we introduced our project idea of E-Masjid System. We explained the issues with the current management of mosques and how our digital solution will help. We specified clear objectives and scope of our project. We also identified stakeholders and discussed tools we will be using.  
Chapter No 2
Literature Review  
2.1	Literature Survey
We looked at how mosques currently manage their work. We saw that most mosques in                                   Pakistan use paper registers for keeping records. We also searched online and found some mosque management systems but they are mostly made for other countries. These systems do not match the needs of Pakistani mosques like handling local nikah booking or showing expenses in a simple way that our community trusts.
2.2	Related Work:  
There are some systems which are being used for churches that handle donation, events   and prayer schedule. In Pakistan most mosque still use old methods like keeping records in register or making announcements on speaker. Most existing Islamic applications focus only on prayer times, Quran reading and Qibla direction, they don't help in mosque management.  
2.3	Gap Analysis:  
After checking existing solutions, we found several important gaps Firstly, we have seen that no system has been made for Pakistani mosque that handle situations like nikah registrar booking. Secondly, the current system does not give the financial transparency that people want. Our project fills these gaps with a cheap and easy to use platform.  
2.4	Summary
In this chapter, we have observed how mosques work today. We found that most use old methods that have problems. Our system will solve these problems by giving one platform for all mosque work. This chapter gave us an idea about the features that we need to add in our project.
 
Chapter No 3
Software Requirements Specification 

3.1	Requirements Analysis
This section explains the detailed requirements for the E-Masjid System. The main purpose of this SRS is to explain what our system will do and who will use it and what functions it will perform. This analysis helps us to understand that what features to build and how they should work for different types of users.
3.2	User classes and characteristics

Table 5 User classes
User Class	User Characteristics
Mosque Administration	People who manage mosque operations like imam and committee members. They need full control over system and ability to manage all activities.
Donor	People who give donations to the mosque. They can view donation records and reports. They may donate online or in person.
Community Members	Local people who visit mosque regularly. They need to see prayer times, announcements, events and request services. They have limited access.
Religious Scholars	Islamic scholars who perform nikah ceremonies. They need to manage their availability and see their booking schedule.

3.3	Requirement Identifying Technique

To find out what our E-Masjid System should do, we used different methods to understand what users really need. First, we talked to imam and listened to the problems related to mosque. They told us about manual record keeping, lack of transparency in donations, and how difficult it is to manage events. Then we used the Use Case technique because our system is an interactive website where different users do different things. This helped us understand how community members, mosque admins, and religious scholars will use the system. We made use case diagrams to show all the main features clearly.

3.4	Functional Requirements
We identified 11 main functional requirements for our system. Each feature has specific functional requirements that explain what the system should do. These requirements are written from users view to clearly explain the expected behavior.
Functional Requirement 1
Table 6 Functional Requirement 1
Identifier	FR-1
Title	User Registration and Login
Requirement	The system will allow users to register and login with email and password, with different access levels for admin, Religious Scholar and community members.
Source	System security needs
Inputs	Email, password, name, phone number, user role
Destination	User data is stored in database and login result is shown on screen
Outputs	Successful registration and login message or error message
Rationale 	To protect sensitive information and manage permissions
Business Rule 	Admin users have full access, community users and religious scholar have limited access
Dependencies	None
Priority	High
Functional Requirement 2
Table 7 Functional Requirement 2
Identifier	FR-2
Title	Record Donations
Requirement	The mosque admin will be able to record cash donations with donor name, amount, date, and donation type.
Source	Mosque committee discussion
Inputs	Donor name, amount, date, donation type
Destination	Saved in donations collection in database
Outputs	Donation record created and success message shown
Rationale 	To maintain proper records and show transparency
Business Rule 	Each donation must have at least donor name and amount
Dependencies	FR-1
Priority	High
Functional Requirement 3
Table 8 Functional Requirement 3
Identifier	FR-3
Title	Record Mosque Expenses
Requirement	Admin can add where mosque money is spent like for repairs, electricity etc.
Source	Discussions with mosque imam about community trust issues.
Inputs	Expense description, amount, date, category
Destination	Saved in expenses collection
Outputs	Expense record added successfully
Rationale 	Community wants to see how their donations are being used
Business Rule 	Every expense must have description, amount, and date
Dependencies	FR-1
Priority	High
Functional Requirement 4
Table 9 Functional Requirement 4
Identifier	FR-4
Title	Show Donation and Expense Reports
Requirement	The system will show donation records, expense details, and financial reports so people can see both income and spending.
Source	Discussions with mosque imam about community trust issues.
Inputs	Selection of report date or month
Destination	Displayed on admin and user dashboard
Outputs	List of donations, list of expenses, total income, total expenses
Rationale 	People want to see where their money is spent.
Business Rule 	Reports should show income vs expenses clearly.
Dependencies	FR-2, FR-3
Priority	High
Functional Requirement 5
Table 10 Functional Requirement 5

Identifier	FR-5
Title	Event & Announcement Management
Requirement	The admin will be able to add, update, or remove events and announcements such as Islamic classes, community programs, and Eid prayers. Users can view them on the main page.
Source	Community engagement needs
Inputs	Event title, date, time, description, announcement details
Destination	Stored in database and shown on website homepage
Outputs	Event or announcement published successfully
Rationale 	Helps mosque communicate better with community
Business Rule 	Events should show date, time and location clearly
Dependencies	FR-1
Priority	Medium
Functional Requirement 6
Table 11 Functional Requirement 6
Identifier	FR-6
Title	Book Nikah Services
Requirement	Community members will be able to book nikah registrar for nikah ceremonies by selecting date and providing contact details
Source	Community needs this service
Inputs	Date, time, contact information, ceremony details
Destination	Saved in nikah bookings collection
Outputs	Booking request submitted and confirmation message
Rationale 	People need easy way to arrange nikah registrar
Business Rule 	Booking requests must include confirm date and contact information
Dependencies	FR-1
Priority	Medium
Functional Requirement 7
Table 12 Functional Requirement 7
Identifier	FR-7
Title	Manage Prayer Times
Requirement	The admin will be able to set and update daily prayer times including special timings for Jummah and Ramadan.
Source	Basic religion need
Inputs	Fajr, Zuhr, Asr, Maghrib, Isha times, special timings
Destination	Saved in prayer times collection
Outputs	Updated prayer times visible to everyone
Rationale 	People need accurate prayer schedules.
Business Rule 	Prayer times must be visible without login.
Dependencies	FR-1
Priority	High
Functional Requirement 8
Table 13 Functional Requirement 8
Identifier	FR-8
Title	Online Donation System
Requirement	Community members will be able to make donations online through the website. They will enter the amount and personal details, process payments securely using Stripe, and see a success message on the screen after the payment is processed.
Source	Community needs an easier way to donate
Inputs	Donation amount, card details, donor information
Destination	Saved in donations collection and sent to Stripe for processing
Outputs	Payment success or failure message and donation recorded
Rationale 	People want to donate easily without visiting mosque
Business Rule 	Each online donation must record donor information and amount
Dependencies	FR-1
Priority	Medium
Functional Requirement 9
Table 14 Functional Requirement 9
Identifier	FR-9
Title	Password Reset through Email
Requirement	If users forget their password, they can reset it using their email address.
Source	Basic every users and system need
Inputs	User email address
Destination	Email sent to user with reset link
Outputs	Password reset email sent and password change successful
Rationale 	People often forget passwords and need an easy way to get back into their account
Business Rule 	The reset link should work only for 24 hours and can be used one time
Dependencies	FR-1
Priority	High
Functional Requirement 10
Table 15 Functional Requirement 10
Identifier	FR-10
Title	Check Nikah Booking Status
Requirement	Users can see if their Nikah request is pending, accepted, or rejected
Source	Community members want to check their nikah request status
Inputs	User clicks on "My Nikah Bookings"
Destination	Displayed on user my booking page
Outputs	List of bookings with current status
Rationale 	People want to know what is happening with their booking request
Business Rule 	The status should update automatically when scholar changes it
Dependencies	FR-6
Priority	Medium
Functional Requirement 11
Table 16 Functional Requirement 11
Identifier	FR-11
Title	Create Scholar Accounts
Requirement	Admin can create special accounts for religious scholars who perform Nikah service 
Source	Use Case Analysis
Inputs	Scholar name, email, phone, specialization
Destination	Saved in users collection with "scholar" role
Outputs	Scholar account created and scholar can login
Rationale 	Scholars need their own accounts to manage Nikah requests
Business Rule 	Only admin can create and manage these special accounts
Dependencies	FR-1
Priority	Medium
3.5	Non-Functional Requirements
This section describes the quality requirements of our system that how it should perform and how easily we can use it and how secure it should be.
1.	Reliability 
The system must be reliable in the day to day running of the mosque. It should not crash frequently and should recover quickly if any problems occur.
1.	 The system must stay running during busy times like Jumuah and Ramadan.
2.	If there is a problem, the system should recover quickly to avoid long pauses.
3.	Donation data should not be lost even if system has problems
4.	Important data should be automatically backed up after every week
2.	Usability
The system must be easy to use and less complex to the mosque admin and ordinary users. All buttons and forms will be clear and labeled properly. 
1.	Prayer times should be available to new users in 2 clicks
2.	Donation recording process should take less than 3 minutes for admin
3.	Nikah booking form should be completable within 5 minutes
4.	Large fonts and clear buttons should be used by the elderly users in interface
5.	Every key feature must be available at home page
3.	Performance
When there are several people using the system, it should be fast and easily functioning.
1.	Prayer times page should load within 3 seconds
2.	Donation reports should generate within 5 seconds
3.	System should handle up to 100 users at the same during Friday prayers
4.	The registration of the event must take a maximum of 5 seconds
4.	Security 
The system should protect sensitive information like donor details and maintain privacy. 
1.	Database should store user passwords in an encrypted format
2.	The system must not allow unauthorized access to administrator functions
3.	Session should timeout after 1 hour of inactivity
4.	All payment transactions must be secured using SSL encryption.
3.6	External Interface Requirements
This section describes how our E-Masjid system will interact with users and other systems. It covers the user interface design, software connections, and communication methods. 
1.	User Interfaces Requirements
We will have a clean and simple interface on our system which will be effective with the mosque users who are aged, administrators and community members.
Design Guidelines:
1.	Use simple colors that are common in Islamic design
2.	Large buttons and text for easy reading, especially for aged users
3.	Consistent navbar menu on all pages
4.	Prayer times always visible on the header
5.	Mobile friendly design that works on smartphones and tablets
6.	Use common icons that people can easily understand
7.	Error messages in simple language, not technical terms
Layout Standards:
1.	Homepage shows prayer times, announcements, and quick access to main features
2.	Admin dashboard with clear sections for donations, events, and services
3.	Forms should be simple with clear labels and instructions
4.	Use responsive design that adjusts to different screen sizes
2.	Software Interfaces
The system will use the following software tools.
Frontend:
1.	React.js web application running in modern browsers 
2.	 Works on iPhones and Android phones
Backend:
1.	Node.js server with Express.js framework
2.	MongoDB database for storing all data
3.	JWT tokens for user authentication
External Services:
1.	Stripe payment gateway will be used for real online donations
2.	Email service for sending password reset links.

3.	Hardware Interfaces
The system will run on any normal computer or smartphone that has an internet connection and a browser. No special hardware is required, but a basic server will host the system.
4.	Communications Interfaces
Our system will use web communication:
Network Requirements:
1.	Web access through Standard HTTP/HTTPS
2.	Internet connection needed to operate the system
3.	No special network configuration needed
Communication Features:
1.	Basic website notifications for new announcements
2.	No SMS integration initially 
3.	No email marketing system
4.	Simple contact forms for communication


3.7	Use case Analysis
Community User Use Cases

Use Case #1 – Register User
Table 17 Use Case 1
UC Identifier	UC1
Use Case Name	Register User
Requirements Traceability	FR-1
Purpose	To allow new users to register in the system using email and password.
Priority	High
Preconditions	User is not already registered.
Post conditions	New user account created.
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User opens registration page.
2. Enters name, email, phone no, password.
3. System validates input.
4. Account created successfully.
5. User can now login to the system 
Alternate Flows	 User already exists then system shows “Email already registered.”
Exceptions	Invalid input fields or server error.
Includes	None
Use Case #2 – Login User
Table 18 Use Case 2

UC Identifier	UC2
Use Case Name	Login User
Requirements Traceability	FR-1
Purpose	To let registered users log in using email and password.
Priority	High
Preconditions	User must be registered.
Post conditions	User successfully logged in
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User enters email and password.
2. System checks credentials.
3. If correct, user is logged in and taken to homepage. 
Alternate Flows	If wrong password then system show “Invalid email or password.”
Exceptions	Server not responding
Includes	Forgot Password
Use Case #3 – Forgot Password
Table 19 Use Case 3
UC Identifier	UC3
Use Case Name	Forgot Password
Requirements Traceability	FR-9
Purpose	To help users who forgot their password
Priority	High
Preconditions	User must be registered with valid email
Post conditions	User can set new password and login
Actors	Community Member

Extends	Login User
Main Success Scenario	
1. User clicks "Forgot Password" on login page
2. Enters email address
3. System sends password reset link to email
4. User clicks link in email
5. Enters new password
6. System updates password
7. User can now login with new password 

Alternate Flows	If email not found, system still shows "If email exists, reset link sent" for security
Exceptions	
If email service is not working

Includes	User authentication
Use Case #4 – View Prayer Times
Table 20 Use Case 4

UC Identifier	UC4
Use Case Name	View Prayer Times
Requirements Traceability	FR-7
Purpose	To let users see daily prayer timings
Priority	High
Preconditions	None 
Post conditions	User can see all prayer times
Actors	
Community Member

Extends	None
Main Success Scenario	1. User visits website homepage
2. Prayer times are displayed on top of page
3. User can see Fajr, Zuhr, Asr, Maghrib, Isha times
4. Special timings for Jummah are also shown on prayer times page
Alternate Flows	User can view weekly prayer schedule
Exceptions	
If admin hasn't updated times, show default times

Includes	None
Use Case #5 – View Events & Register
Table 21 Use Case 5

UC Identifier	UC5
Use Case Name	View Events & Register
Requirements Traceability	FR-5
Purpose	To see mosque events and register for them
Priority	Medium
Preconditions	User must be logged in to register
Post conditions	User registered for event
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User goes to Events page
2. Views list of upcoming events
3. Clicks on event to see details
4. Clicks "Register for Event"
5. System confirms registration
6. User gets confirmation message


Alternate Flows	User can view events without login, but needs login to register
Exceptions	If system cannot register user due to server issue

Includes	Login User
Use Case #6 – View Donation Records
Table 22 Use Case 6

UC Identifier	UC6
Use Case Name	View Donation and Expense Records
Requirements Traceability	FR-4
Purpose	To see donation reports and where money is spent
Priority	High
Preconditions	User must be logged in to view reports
Post conditions	User can see financial reports
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User goes to donation report page
2. Views donation records and amounts
3. Sees expense details like "5000 for new ceiling fans"
4. Builds trust in mosque management
Alternate Flows	User can filter reports by date filter
Exceptions	If no data available, show "No records yet"

Includes	Login User
Use Case #7 – View Announcements
Table 23 Use Case 7

UC Identifier	UC7
Use Case Name	View Announcements
Requirements Traceability	FR-5
Purpose	To read important mosque announcements
Priority	Medium
Preconditions	None
Post conditions	User reads announcements
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User visits website homepage
2. Announcements are shown in main section
3. User reads important updates
4. Urgent announcements are highlighted in red
Alternate Flows	User can see old announcements
Exceptions	If no announcements, show "No current announcements" 
Includes	None 
Use Case #8 – Make Donation
Table 24 Use Case 8
UC Identifier	UC8
Use Case Name	Make Online Donation
Requirements Traceability	FR-8
Purpose	To donate money to mosque online
Priority	Medium
Preconditions	User must be logged in 
Post conditions	Donation processed and recorded
Actors	
Community Member, Donor

Extends	None
Main Success Scenario	
1. User clicks "Donate Online"
2. Selects donation type 
3. Enters amount in rupees
4. Enters card details for Stripe payment
5. Clicks "Donate Now"
6. Stripe processes payment
7. System shows "Donation Successful"
Alternate Flows	If user is not logged in, system redirects user to Login page before allowing donation.
Exceptions	If payment fails then show "Payment failed try again"
Includes	Login User
Use Case #9 – Book Nikah Services
Table 25 Use Case 9
UC Identifier	UC9
Use Case Name	Book Nikah Services
Requirements Traceability	FR-6
Purpose	To book religious scholar for marriage ceremony
Priority	Medium
Preconditions	User must be logged in 
Post conditions	Nikah booking request submitted
Actors	
Community Member

Extends	None
Main Success Scenario	
1. User goes to Nikah Services page
2. Selects preferred date and time
3. Fills contact details and ceremony information
4. Submits the request
5. System sends confirmation "Request Submitted"
Alternate Flows	 User can view their previous bookings
Exceptions	If date not available, show "Please select another date"
Includes	Login User
Use Case #10 – View Booking Status
Table 26 Use Case 10
UC Identifier	UC10
Use Case Name	View Booking Status
Requirements Traceability	FR-10
Purpose	To check if Nikah booking request is accepted or pending
Priority	Medium
Preconditions	User must be logged in and have booking request
Post conditions	User sees current status of their request
Actors	
Community Member

Extends	Book Nikah Services
Main Success Scenario	
1. User goes to My Bookings page
2. Views list of their Nikah requests
3. See status like Pending, Accepted, or Rejected
4. If accepted, sees confirmed date and time
5. If rejected, sees reason if provided
Alternate Flows	 User can cancel pending requests
Exceptions	If no bookings, show "No booking requests yet"
Includes	Login User
Admin Use Cases
Use Case #11 – Admin Login
Table 27 Use Case 11
UC Identifier	UC11
Use Case Name	Admin Login
Requirements Traceability	FR-1
Purpose	To let mosque admin access the admin dashboard
Priority	High
Preconditions	Admin must have admin account details
Post conditions	Admin gains access to admin dashboard
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to special /admin/login URL
2. Enters admin username and password
3. Clicks "Admin Login"
4. System verifies admin details
5. Admin dashboard opens with all management options
Alternate Flows	 If wrong details, show "Invalid admin login"
Exceptions	 If admin account not set up yet 
Includes	User Authentication
Use Case #12 – Manage Donations & Expenses
Table 28 Use Case 12
UC Identifier	UC12
Use Case Name	Manage Donations & Expenses
Requirements Traceability	FR-2, FR-3
Purpose	To handle all money records like donations and expenses
Priority	High
Preconditions	Admin must be logged in
Post conditions	Financial records updated
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to Manage Donations & Expenses section
2. Can add new cash donations with donor details
3. Can record expenses like "5000 for mosque repairs"
4. Can edit or delete existing records
5. System updates financial reports automatically
Alternate Flows	 Admin can generate monthly financial reports
Exceptions	 If invalid data entered, show appropriate error messages 
Includes	Admin Login
Use Case #13 – Manage Prayer Times
Table 29 Use Case 13
UC Identifier	UC13
Use Case Name	Manage Prayer Times
Requirements Traceability	FR-7
Purpose	To set and update daily prayer timings for community
Priority	High
Preconditions	Admin must be logged in
Post conditions	New prayer times displayed on website
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to Prayer Times section
2. Updates all five daily prayer times 
3. Sets special Jummah prayer timings
4. Clicks "Save Times"
5. New times immediately show on website for everyone
Alternate Flows	 Admin can set weekly schedule instead of daily updates
Exceptions	 If invalid time format, show "Please use correct time format"
Includes	Admin Login
Use Case #14 – Manage Events
Table 30 Use Case 14
UC Identifier	UC14
Use Case Name	Manage Events
Requirements Traceability	FR-5
Purpose	To create, update, and manage mosque events
Priority	Medium
Preconditions	Admin must be logged in
Post conditions	Events published and visible to community
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to Events Management section
2. Creates new events with details and registration options
3. Updates existing event information
4. Deletes or cancels events when needed
5. Events appear on website for community registration
Alternate Flows	 Admin can save events as drafts before publishing
Exceptions	If past date entered, show "Event date cannot be in past"
Includes	Admin Login
Use Case #15 – Manage Announcements
Table 31 Use Case 15
UC Identifier	UC15
Use Case Name	Manage Announcements
Requirements Traceability	FR-5
Purpose	To post and manage important mosque announcements
Priority	Medium
Preconditions	Admin must be logged in
Post conditions	Announcements visible on website
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to Announcements section
2. Creates new announcements with titles and details
3. Updates existing announcements if information changes
4. Deletes old or incorrect announcements
5. Marks announcements as urgent if important
6. Announcements show on website immediately
Alternate Flows	Admin can schedule announcements for future dates
Exceptions	If announcement too long, show "Please shorten announcement"
Includes	Admin Login
Use Case #16 – Manage Religious Scholar Account
Table 32 Use Case 16
UC Identifier	UC16
Use Case Name	Manage Religious Scholar Account
Requirements Traceability	FR-11
Purpose	To create and manage account for Nikah service scholars
Priority	Medium
Preconditions	Admin must be logged in
Post conditions	Scholar accounts created and activated for Nikah management
Actors	
Mosque Admin

Extends	None
Main Success Scenario	
1. Admin goes to Scholar Management section
2. Creates new scholar accounts with login details
3. Updates scholar account details if needed
4. Deletes or deactivates scholar accounts
5. Scholars receive login details and can manage Nikah requests
Alternate Flows	Admin can reset scholar passwords if forgotten
Exceptions	If email already used, show "Email already registered"
Includes	Admin Login
Religious Scholar Use Case
Use Case #17 – Check Nikah Requests
Table 33 Use Case 17

UC Identifier	UC17
Use Case Name	Check Nikah Requests
Requirements Traceability	FR-6
Purpose	To allow religious scholars to check new nikah booking requests and update their status as accepted or rejected.
Priority	Medium
Preconditions	The religious scholar account must already be created by the mosque admin, and the scholar must be logged into the system.
Post conditions	The nikah request status is updated to either “Accepted” or “Declined,” and the request status is updated in the admin dashboard.
Actors	Religious Scholar, Mosque Admin
Extends	None
Main Success Scenario	1.Religious scholar logs into system
2.Goes to "Nikah Requests" page
3.Views list of pending booking requests
4.Clicks on a request to see details 
5.Clicks "Accept" or "Decline" button
6.System updates request status
7.Admin sees updated status in dashboard
Alternate Flows	If no requests available, system shows "No pending requests"
If scholar tries to accept conflicting time, system shows "Time not available"
Exceptions	If system error occurs, shows "Unable to update request"
Includes	User authentication
Use Case Diagram
These diagrams shows all the users and features of our E-Masjid system. It helps show how different users interact with different parts of the system.

 

Figure 1 Use Case diagram of Community members
 

Figure 2 Use Case diagram of Mosque Admin
 

Figure 3 Use Case diagram of Religious Scholar
3.8	Storyboards
This section shows how users will use our system in real life. Each storyboard explains one main feature that happen on screen.
Storyboard 1 – Online Donation System

 

Figure 4 Online Donation Storyboard








Storyboard 2 – Event Management
 
Figure 5 Event Management Storyboard
Storyboard 3 – Nikah Booking
 
Figure 6 Nikah booking Storyboard
3.9	Summary 

In this SRS document, we explained all the main requirements and features of our E-Masjid System. We started by understanding the problems faced by mosque committees and community members, then used use cases and storyboards to identify the real needs of the system. We listed both functional and non-functional requirements like donation management, prayer time management, nikah service requests, and security. This document helped us to understand what our system will do, who will use it and how each feature will work. Overall, this SRS gives a complete picture of the system before we start coding.

 


Chapter No 4
Software Design Specification
 
4.1	System Design
Our E-Masjid System is a complete web-based platform that will be accessible through any modern web browser. The system is designed to serve mosque administration for managing operations and community members can use these services.

Dependencies
1.	Stable internet connection for all users.
2.	Stripe service availability for payment processing.
3.	Modern web browsers supporting React.js features.
4.	MongoDB database server for data storage.

Interaction with Other Systems
1.	Stripe Payment Gateway:  It is used for making online donations securely.
2.	Email Service: It is used for sending password reset links.
3.	Internet Connection: It is required for all users to access the system.

Design Constraints
1.	Performance Requirements: Prayer times page loads within 3 seconds, handles 100+ users during Friday prayers.
2.	Usability Requirements: Simple interface with large buttons, works on mobile and computer, elderly friendly design.
3.	Security Requirements: Encrypted passwords, secure payments through Stripe, admin access protection.
4.	Technical Constraints: MERN stack technology, responsive design, automatic weekly backups.


4.2	Design Considerations

Assumptions 
Following are the assumptions:
1.	Mosque administrators have basic computer knowledge.
2.	Users have internet access and email accounts.
3.	The mosque has at least one computer for admin use.
4.	Religious scholars can use basic web applications.
5.	Community members can use web browsers on phones or computers.

Dependencies
Following are the dependencies:
1.	Stable internet connection for all users.
2.	Stripe payment service available at any time.
3.	Web browsers supporting modern JavaScript.
4.	MongoDB database running properly.

Limitations
Following are the limitations:
1.	Cannot work without internet connection.
2.	No SMS notifications for announcements.
3.	No mobile app version.
4.	Payment system requires card payments only.
5.	Cannot handle offline data entry.

Risks
Following are the risks:
1.	Payment security issues.
2.	System downtime during prayer times.
3.	Elderly users finding the system difficult.
4.	Data loss from system crashes

4.3	Requirements Traceability Matrix 

Table 34  Requirements Traceability Matrix
Requirement ID	Scope	Requirement Description	Design Specification
FR-1	User Management	The system will allow users to register and login with email and password, with different access levels for admin, religious scholar and community members	Component "User Authentication Module"
FR-2	Donation Management	The mosque admin will be able to record cash donations with donor name, amount, date, and donation type	Component "Donation Management Module"
FR-3	Expense Tracking	Admin can add where mosque money is spent like for repairs, electricity etc.	Component "Expense Management Module"
FR-4	Financial Reports	The system will show donation records, expense details, and financial reports so people can see both income and spending	Component "Financial Reporting Module"
FR-5	Event and Announcements
Management	The admin will be able to add, update, or remove events and announcements such as Islamic classes, community programs, and Eid prayers. Users can view them on the main page	Component "Event & Announcement Manager"
FR-6	Nikah Services	Community members will be able to book nikah registrar for nikah ceremonies by selecting date and providing contact details	Component "Nikah Booking Module"
FR-7	Prayer Times	The admin will be able to set and update daily prayer times including special timings for Jummah and Ramadan	Component "Prayer Times Manager"
FR-8	Online Payments	Community members will be able to make donations online through the website.	Component "Online Payment Module"
FR-9	Account Security	If users forget their password, they can reset it using their email address	Component "Password Recovery Module"
FR-10	Booking Status	Users can see if their Nikah service request is pending, accepted, or rejected	Component "Booking Status Tracker"
FR-11	User Role Management	Admin can create special accounts for religious scholars who perform Nikah	Component "User Account Manager"

4.4	Design Models 
In this section, we show how we designed the E-Masjid System. We made different diagrams to explain the system structure, how data is organized, and how different parts of the system work together. These pictures make the design easy to understand for everyone.
1.	Design Class Diagram 

 
Figure 7 Class diagram
2.	Sequence Diagram 

User Login Sequence Diagram

 
Figure 8 Login Sequence Diagram
Online Donation Sequence Diagram
 
Figure 9 Online Donation Sequence Diagram






Nikah Booking Sequence Diagram

 
Figure 10 Nikah Booking Sequence Diagram

Prayer Times Update Sequence Diagram

 
Figure 11 Admin Update Prayer Times Sequence Diagram





3.	State Transition Diagram 
These diagrams show how the system status changes when a user performs different actions.

 
Figure 12 User Account State Diagram
 
Figure 13 Nikah Booking Status State Diagram


 

Figure 14 Event State Diagram




4.5	Architectural Design 
Our E-Masjid System follows the MVC architecture pattern. This separates the system into three main parts.
1.	Model: Handles data and business logic.
2.	View: User interface that users see.
3.	Controller: Processes user requests and connect Model and View. 

 
Figure 15  High-Level System Architecture








1.	UML Component diagram

 


Figure 16 Component diagram

4.6	Data Design
Our system uses MongoDB database to store information. We have separate collections for different things like users, donations, events etc. Each collection keeps related information together. Admin and religious scholars are both in the users collection, with different role values.
Database Collections Structure:
1.	Users Collection
1.1.	 Stores all user information including admin, community members, and religious scholars.
1.2.	 Uses role based access control. 
1.3.	 Fields: userId, name, email, password, role, phone, address, specialization. 
2.	Donations Collection
2.1	 Records all donation transactions. 
2.2	 Links to donor information for transparency.
2.3	 Fields: donationId, donorId, amount, date, type , paymentMethod.
3.	Expenses Collection
3.1.	 Tracks mosque expenditure for financial transparency.
3.2.	 Categorized expenses for better reporting.
3.3.	 Fields: expenseId, description, amount, date, category. 
4.	Events Collection
4.1.	 Manages mosque events and programs.
4.2.	 Supports online registration.
4.3.	 Fields: eventId, title, description, date, time, location, maxParticipants, registeredUsers[ ].
5.	Announcements Collection
5.1.	 Stores important mosque announcements.
5.2.	 Supports urgent flag for important updates.
5.3.	 Fields: announcementId, title, content, date, isUrgent, publishedBy.
6.	Prayer Times Collection
6.1.	 Stores daily prayer schedules.
6.2.	 Special entries for Jummah and Ramadan.
6.3.	 Fields: prayerTimeId, date, fajr, zuhr, asr, maghrib, isha, jummah, isSpecial.
7.	Nikah Bookings Collection
7.1.	 Manages nikah service requests.
7.2.	 Tracks booking status. 
7.3.	 Fields: bookingId, userId, scholarId, date, time, status, contactInfo, ceremonyDetails.

Data Relationships:
1.	One-to-many: One user can make multiple donations.
2.	One-to-many: One admin can create multiple events.
3.	Many-to-many: Many users can register for many events.
4.	One-to-one: Each day has one prayer time schedule.
1.	Data Dictionary
Table 35 Data Dictionary Table
Terminology	Description
Users Collection	Stores all system user accounts
userId	String, Primary key for user identification
Name	String, Full name of the user
Email	String, User email address 
Password	String, Encrypted password for security
Role	String, User role (admin/community/scholar)
Phone	String, Contact phone number.
Address	String, User residential address
Specialization	String, For scholars area of expertise
Donations Collection	Records all financial donations
donationId	String, Unique donation identifier
donorId	String, Reference to user who donated
Amount	Number, Donation amount in rupees
Date	Date, When donation was made
Type	String, Donation type (Zakat/Sadaqah/Mosque Fund)
paymentMethod	String, Cash or Card payment
Expenses Collection	Tracks mosque spending
expenseId	String, Unique expense identifier
Description	String, Where the money was spent on
Amount	Number, Expense amount in rupees
Date	Date, When fund is spent
Category	String, Expense category 
Events Collection	Manages mosque events
eventId	String, Unique event identifier
Title	String, Event name/title
Description	String, Detailed event information
Date	Date, Event date
Time	Time, Event time
Location	String, Where event will be held
maxParticipants	Number, Maximum allowed attendees
registeredUsers	Array, List of user IDs who registered
Announcements Collection	Stores mosque announcements
announcementId	String, Unique announcement identifier
Title	String, Announcement headline
   Content	String, Full announcement text
Date	Date, When announcement was posted
isUrgent	Boolean, Marks urgent announcements
publishedBy	String, Admin who posted the announcement
PrayerTimes Collection	Stores prayer schedules
prayerTimeId	String, Unique prayer time identifier
Date	Date, Date for prayer times
Fajr	Time, Fajr prayer time
Zuhr	Time, Zuhr prayer time
Asr	Time, Asr prayer time
Maghrib	Time, Maghrib prayer time
Isha	Time, Isha prayer time
Jummah	Time, Jummah prayer time 
NikahBookings Collection	Manages marriage service requests
bookingId	String, Unique booking identifier
userId	String, Reference to user who booked
scholarId	String, Reference to assigned scholar
Date	Date, Requested ceremony date
Time	Time, Requested ceremony time
Status	String, Current status (Pending/Accepted/Rejected)
contactInfo	String, User contact details for ceremony
ceremonyDetails	String, Additional ceremony information

4.7	User Interface Design
The E-Masjid System will have a clean, simple, and easy to use interface designed for all
types of users, including elderly people who may not be comfortable with complex technology.
User Experience
1.	Homepage: Shows current prayer times, recent announcements, and quick access buttons for main features.
2.	Navigation: Simple menu at the top with clear labels. 
3.	Mobile Friendly: All screens work perfectly on mobile phones and tablets.
4.	Elderly Friendly: Large buttons, clear text, and simple forms. 

How Different Users Will Use the System:

For Community Members:
1.	Prayer times always visible on top of  home page.
2.	Simple donation form with card payment option.
3.	Registration button for events.
4.	Easy booking form for nikah.
5.	View booking status in mybooking page.

For Mosque Admin:
1.	Special admin panel accessible through /admin URL.
2.	Simple forms to add/update donations, expenses, events, announcements.
3.	Financial reports showing income and expenses.
4.	Create and manage religious scholar accounts.

For Religious Scholars:
1.	View pending requests in simple list format.
2.	One click buttons to accept or reject bookings.
3.	See their booked ceremonies in calendar view.

Feedback and Messages:
1.	Green popup messages for successful actions.
2.	Red popup messages with simple explanations.
3.	"Are you sure?" prompts for important actions.
1.	Screen Images 
We have created basic screen designs to show how the interface will look. These designs follow our guidelines of simplicity and ease of use.
 
Figure 17 Home page design










 
Figure 18 Login page design
 
Figure 19 Donation Transparency page design
 
Figure 20 Admin Dashboard design
 

Figure 21 Scholar page design
2.	Screen Objects and Actions
Use Case 1: Making an Online Donation
Screen Objects:
1.	Donation Amount Field: Text box to enter donation amount.
2.	Donation Type: Select Zakat, Sadaqah, or Mosque Fund.
3.	Card Details Form: Fields for card number, expiry, CVC.
4.	Donate Now Button: Green button to submit donation.
Actions:
1.	User enters amount: System validates it is a positive number.
2.	User selects donation type: System shows description of that type.
3.	User enters card details: System validates card format.
4.	User clicks Donate Now: System processes payment via Stripe.
5.	Payment successful: Shows green "Donation Successful" message on the dashboard.
6.	Payment failed: Shows red "Payment Failed" message with retry option.

Use Case 2: Admin Creating an Event
Screen Objects:
1.	Event Title Field: Text box for event name.
2.	Date and Time Pickers: Calendar and time selectors.
3.	Description Box: Large text area for event details.
4.	Location Field: Text box for event location.
5.	Max Participants Field: Number field for attendance limit.
6.	Publish Button: Blue button to publish event.
7.	Save Draft Button: Gray button to save for later.
Actions:
1.	Admin enters event details: System validates all required fields.
2.	Admin sets date/time: System checks date is not in past.
3.	Admin sets max participants: System validates positive number.
4.	Admin clicks Publish: System creates event and shows on website.
5.	Event published: Shows green "Event Published Successfully".
6.	Validation error: Shows red message next to incorrect field.


4.8	Design Decisions
This section explains the main design choices we made for the E-Masjid System and why we chose them.
We decided to use the MVC pattern for our system. This means we separate our code into three main parts which is model, view and controller
We are using the MERN stack for our project. We chose this because all parts use JavaScript which makes development faster.
We picked MongoDB instead of traditional SQL databases because it works naturally with JavaScript and Node.js. 
We choose Stripe for online donations because it is very secure and handles card details safely and many other projects use it successfully.
We plan to deploy the system on cloud services because it is more reliable than our own computers and can handle more users during busy times. It automatically backs up data and it is affordable for a mosque budget.
4.9	Summary 

This Software Design Specification show the complete technical plan for our E-Masjid System. We have explained the MVC architecture, MERN technology, database design, and user interfaces. The design describes all functional requirements and provides clear guidance for development.
 
References 
References


1.	World Wide Web 
[1] Meta Platforms Inc., "React Documentation,". Available: https://react.dev/. 
[2] System Design Specification (SDS) "YouTube lecture used to understand Software / System Design Specification". Available: https://www.youtube.com/watch?v=hOH7eD9NJgY .
[3] Class Diagram (UML), "YouTube tutorial used to learn UML Class Diagrams". Available: https://www.youtube.com/watch?v=6XrL5jXmTwM . 
[4] Component Diagram, "YouTube tutorial used to understand Component Diagrams". Available: https://youtu.be/CW9Ts2qLfEI?si=QXdUxthCEo-fcigr .
[5] Sequence Diagram, "YouTube tutorial used to learn Sequence Diagrams using draw.io". Available: https://www.youtube.com/watch?v=rsTWufuP328 .
[6] OpenJS Foundation, "Node.js Documentation,". Available: https://nodejs.org/en/docs/. 
[7] MongoDB Inc., "MongoDB Manual,". Available: https://www.mongodb.com/docs/manual/. 
[8] The guide for using Mongoose with a database., "Mongoose Documentation," Available: https://mongoosejs.com/docs/. 
[9] Stripe Inc., "Stripe API Reference,". Available: https://stripe.com/docs/api. 
[10] Auth0, "Introduction to JSON Web Tokens,". Available: https://jwt.io/introduction. 
[11] Draw.io User Manual for UML Diagrams. Available: https://www.drawio.com/.

